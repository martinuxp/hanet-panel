import { Document, Font, Image, Page, Path, Svg, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { renderSVG } from 'uqr'
import { CITIES } from '@/lib/cities'
import { MODULES, type AdminInstitution } from '@/lib/hnt-admin'
import { urlToDataUrl } from '@/lib/data-url'

// "Inscripción a HaNet": el PDF que entrega el asistente al generar el código
// de invitación (mockup aprobado en https://claude.ai/artifact/AkaCT2a99zasKRa1mnj1U1).
// La frase solo existe en este momento: el backend guarda su hash. Este archivo
// se carga aparte (import dinámico) para no sumar react-pdf al resto del panel.

export type InscriptionData = {
  institution: AdminInstitution
  /** null: se descarga otra vez, sin la frase. */
  words: string[] | null
  generatedAt: number | null
  admins: { fullName: string; email: string | null }[]
  roster: { total: number; students: number | null; staff: number | null; courses: number | null }
}

const INK = '#282829'
const SECONDARY = '#5f5e66'
const BODY = '#46454b'
const LINE = '#e4e3e8'
const TILE = '#f1f0f4'
const PINK = '#EF2274'

let fontsReady = false
function registerFonts() {
  if (fontsReady) return
  fontsReady = true
  Font.register({
    family: 'DM Sans',
    fonts: [
      { src: '/pdf-fonts/DMSans_400Regular.ttf', fontWeight: 400 },
      { src: '/pdf-fonts/DMSans_500Medium.ttf', fontWeight: 500 },
      { src: '/pdf-fonts/DMSans_700Bold.ttf', fontWeight: 700 },
    ],
  })
  Font.register({ family: 'Google Sans Flex', src: '/pdf-fonts/GoogleSansFlex_700Bold.ttf', fontWeight: 700 })
  // Sin cortar palabras con guiones: en español queda raro.
  Font.registerHyphenationCallback(word => [word])
}

const styles = StyleSheet.create({
  page: { paddingTop: 42, paddingHorizontal: 48, paddingBottom: 30, fontFamily: 'DM Sans', fontSize: 9.75, color: INK, backgroundColor: '#ffffff' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topRight: { alignItems: 'flex-end', fontSize: 9, color: SECONDARY },
  display: { fontFamily: 'Google Sans Flex', fontWeight: 700, fontSize: 30, lineHeight: '33pt', letterSpacing: -0.8 },
  h2: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
  section: { marginTop: 21 },
  row: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: LINE, paddingVertical: 6.75 },
  rowLabel: { width: 126, color: SECONDARY },
  rowValue: { flex: 1, fontWeight: 500, lineHeight: '13.5pt' },
  code: { marginTop: 21, padding: 24, borderRadius: 18, backgroundColor: INK, color: '#f9f9fa' },
  tiles: { flexDirection: 'row', gap: 9 },
  tile: { flex: 1, padding: 11, borderRadius: 12, backgroundColor: TILE },
  footer: { position: 'absolute', left: 48, right: 48, bottom: 26, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.75, borderTopColor: LINE, paddingTop: 9, fontSize: 8.25, color: SECONDARY },
  step: { flexDirection: 'row', gap: 13, paddingVertical: 4.5, borderBottomWidth: 0.75, borderBottomColor: LINE },
  stepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 11.25, fontWeight: 700, marginBottom: 2 },
  stepBody: { color: BODY, lineHeight: '13pt' },
})

/** El logotipo HaNet (Figma, componente "HaNet"): isotipo rosa y texto gris. */
function HanetLogotype() {
  return (
    <Svg viewBox="0 0 127.712 49" style={{ width: 59, height: 22.6 }}>
      <Path fill={PINK} d="M0 0L11.7101 10.8889V22.2315L17.5652 22.912V15.1991L32.8784 16.5602V32.4398L17.5652 33.8009V26.088L11.7101 26.7685V38.1111L0 49V0Z" />
      <Path fill="#3C3B3E" d="M61.0918 35.3889V12.5222H64.3796V35.3889H61.0918ZM46.4609 35.3889V12.5222H49.7487V35.3889H46.4609ZM49.1898 25.0662V22.3876H61.7822V25.0662H49.1898Z" />
      <Path fill="#3C3B3E" d="M71.6265 35.7809C70.3113 35.7809 69.2154 35.5631 68.3386 35.1276C67.4838 34.6702 66.8372 34.0604 66.3988 33.2982C65.9823 32.536 65.7741 31.7084 65.7741 30.8156C65.7741 29.7484 66.0481 28.8338 66.5961 28.0716C67.166 27.3093 67.977 26.7213 69.0291 26.3076C70.1031 25.8938 71.3854 25.6869 72.8759 25.6869H77.1829C77.1829 24.7069 77.0295 23.9011 76.7226 23.2696C76.4377 22.638 76.0103 22.1698 75.4404 21.8649C74.8705 21.5382 74.18 21.3749 73.369 21.3749C72.3608 21.3749 71.484 21.6253 70.7387 22.1262C70.0154 22.6053 69.577 23.3567 69.4236 24.3802H66.1358C66.2673 23.1824 66.6618 22.1807 67.3194 21.3749C67.977 20.5473 68.8318 19.9158 69.8839 19.4802C70.936 19.0229 72.0977 18.7942 73.369 18.7942C74.9253 18.7942 76.2294 19.0664 77.2816 19.6109C78.3337 20.1553 79.1227 20.9284 79.6488 21.9302C80.1968 22.9102 80.4708 24.0753 80.4708 25.4256V35.3889H77.709L77.3802 32.6776H77.2816C76.9966 33.1784 76.6569 33.6249 76.2623 34.0169C75.8897 34.3871 75.4623 34.7029 74.9801 34.9642C74.4979 35.2256 73.9718 35.4216 73.4019 35.5522C72.8539 35.7047 72.2621 35.7809 71.6265 35.7809ZM72.3827 33.1349C73.1279 33.1349 73.7855 32.9933 74.3554 32.7102C74.9472 32.4271 75.4404 32.046 75.8349 31.5669C76.2514 31.066 76.5582 30.5107 76.7555 29.9009C76.9747 29.2911 77.0952 28.6596 77.1172 28.0062H73.2046C72.2402 28.0062 71.4621 28.1151 70.8703 28.3329C70.3004 28.5507 69.8839 28.8556 69.6209 29.2476C69.3579 29.6396 69.2263 30.0969 69.2263 30.6196C69.2263 31.1204 69.3469 31.5669 69.588 31.9589C69.851 32.3291 70.2127 32.6231 70.673 32.8409C71.1552 33.0369 71.7251 33.1349 72.3827 33.1349Z" />
      <Path fill="#3C3B3E" d="M82.0633 35.3889V12.5222H86.206L96.9901 31.0769H97.0888V12.5222H100.377V35.3889H96.2339L85.4498 16.8342H85.3512V35.3889H82.0633Z" />
      <Path fill="#3C3B3E" d="M109.785 35.7809C108.185 35.7809 106.771 35.4324 105.544 34.7356C104.316 34.0169 103.352 33.026 102.65 31.7629C101.949 30.4998 101.598 29.0189 101.598 27.3202C101.598 25.6216 101.938 24.1407 102.617 22.8776C103.319 21.5927 104.283 20.5909 105.511 19.8722C106.76 19.1536 108.196 18.7942 109.818 18.7942C111.418 18.7942 112.799 19.1536 113.961 19.8722C115.144 20.5691 116.054 21.4947 116.689 22.6489C117.347 23.8031 117.676 25.088 117.676 26.5036C117.676 26.7213 117.665 26.9609 117.643 27.2222C117.643 27.4836 117.632 27.7558 117.61 28.0389H103.998V25.7522H114.388C114.322 24.3802 113.851 23.3131 112.974 22.5509C112.119 21.7669 111.056 21.3749 109.785 21.3749C108.886 21.3749 108.053 21.5709 107.286 21.9629C106.541 22.3549 105.938 22.9429 105.478 23.7269C105.04 24.4891 104.82 25.4691 104.82 26.6669V27.5816C104.82 28.7793 105.04 29.792 105.478 30.6196C105.938 31.4253 106.552 32.0351 107.319 32.4489C108.086 32.8627 108.897 33.0696 109.752 33.0696C110.782 33.0696 111.648 32.8409 112.349 32.3836C113.051 31.9044 113.566 31.262 113.895 30.4562H117.183C116.898 31.4798 116.415 32.3944 115.736 33.2002C115.056 33.9842 114.213 34.6158 113.204 35.0949C112.218 35.5522 111.078 35.7809 109.785 35.7809Z" />
      <Path fill="#3C3B3E" d="M124.884 35.3889C123.832 35.3889 122.923 35.2256 122.155 34.8989C121.388 34.5722 120.796 34.0278 120.38 33.2656C119.964 32.5033 119.755 31.4689 119.755 30.1622V21.7016H116.961V19.1862H119.755L120.15 15.1356H123.043V19.1862H127.712V21.7016H123.043V30.1949C123.043 31.1967 123.24 31.8718 123.635 32.2202C124.03 32.5687 124.709 32.7429 125.673 32.7429H127.515V35.3889H124.884Z" />
    </Svg>
  )
}

/** Un QR como imagen (react-pdf no dibuja SVG externos). */
function qrDataUrl(url: string) {
  const svg = renderSVG(url, { border: 1, blackColor: INK, whiteColor: '#ffffff' })
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

async function qrPng(url: string) {
  const image = new window.Image()
  image.src = qrDataUrl(url)
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 480
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Sin canvas')
  context.imageSmoothingEnabled = false
  context.drawImage(image, 0, 0, 480, 480)
  return canvas.toDataURL('image/png')
}

/** El escudo como PNG en memoria; si no se puede leer, el PDF va con las iniciales. */
function longDate(millis: number) {
  return new Date(millis).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function dayOf(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
}

function count(value: number, one: string, many: string) {
  return `${value.toLocaleString('es-CL')} ${value === 1 ? one : many}`
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]?.toUpperCase()).join('')
}

function InscriptionDocument({ data, shield, qrs, issuedAt }: { data: InscriptionData; shield: string | null; qrs: { app: string; panel: string; docs: string }; issuedAt: number }) {
  const { institution, words, admins, roster } = data
  const city = CITIES.find(item => item.id === institution.cityId)?.name
  const year = institution.schoolYear
  const modules = institution.modules ?? MODULES.map(module => module.id)
  const moduleNames = MODULES.filter(module => modules.includes(module.id)).map(module => module.name)
  const breakdown = roster.students !== null && roster.staff !== null
    ? `: ${count(roster.students, 'estudiante', 'estudiantes')}${roster.courses ? ` en ${count(roster.courses, 'curso', 'cursos')}` : ''} y ${count(roster.staff, 'persona', 'personas')} de docentes y administración`
    : ''

  const rows: [string, string][] = [
    ['Nombre', institution.name],
    ...(city ? [['Ciudad', city] as [string, string]] : []),
    ...(year ? [[`Año escolar ${year.start.slice(0, 4)}`, `Del ${dayOf(year.start)} al ${dayOf(year.end)}.${year.secondSemester ? ` 2° semestre desde el ${dayOf(year.secondSemester)}.` : ''}`] as [string, string]] : []),
    ['Módulos', `Base (Calendar, ClassHall y eventos del liceo)${moduleNames.length ? `, ${moduleNames.join(', ')}` : ''}.`],
    ['Nómina cargada', `${count(roster.total, 'persona', 'personas')}${breakdown}.`],
    ...(admins.length ? [['Administración', admins.map(admin => [admin.fullName, admin.email].filter(Boolean).join(', ')).join('\n')] as [string, string]] : []),
  ]

  const steps: [string, string][] = [
    ['Activar cuentas de administración', `Crea tu HaNet ID en app.hanet.muxp.art, escribe el código de invitación y comprueba tu correo institucional (el que aparece en Administración).${admins.length ? ' Tu cuenta ya tiene el rol Admin.' : ''}`],
    ['Entra al panel web', 'Con tu HaNet ID activo, entra a panel.hanet.muxp.art y comprueba que la información de tu institución sea correcta. Cada inicio de sesión pide un código que llega a tu correo.'],
    ['Protege tu cuenta', 'En Seguridad, dentro del panel, agrega una app de autenticación y guarda tus códigos de respaldo. Así entras aunque no tengas el correo a mano.'],
    ['Da roles a tu equipo', 'Cuando cada persona se une, en Personas y roles le das su rol: docentes, CEE y la directiva de cada curso. Si falta alguien en la nómina base, súmalo en Cargar nómina.'],
    ['Clases y horario', 'Cada docente crea en ClassHall un Hall por asignatura y curso. La directiva de cada curso arma su horario en el Calendar.'],
    ['Centros de Estudiantes', 'Los CEE son parte esencial de HaNet: ellos podrán manejar Feed, Eventos de institución, Alianzas, etc. Oriéntalos a crear su HaNet ID y asígnales su rol en Personas y roles.'],
    ['Días sin clases', 'Si se suspenden las clases o hay salida anticipada, márcalo en el Calendar de la app: las pruebas de ese día pasan solas a la clase siguiente.'],
    ['Invita a los estudiantes', 'Cuando tu comunidad esté lista, comparte el código en clases o por los canales del liceo, nunca en redes públicas. Cada estudiante se une con su correo institucional.'],
    ['Mantén informada a tu comunidad', 'Desde Organizar, en la app, manda avisos a todo el liceo, a una jornada o a cursos, y publica los eventos de la institución.'],
  ]

  const footer = (page: number) => (
    <View style={styles.footer} fixed>
      <Text>Equipo HaNet · muxp@muxp.art · hanet.muxp.art</Text>
      <Text>Documento confidencial de HaNet y {institution.name} · {page} de 2</Text>
    </View>
  )

  return (
    <Document title={`Inscripción a HaNet · ${institution.name}`} author="Equipo HaNet" language="es">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.top}>
          <HanetLogotype />
          <View style={styles.topRight}>
            <Text style={{ fontWeight: 700, color: INK }}>Inscripción a HaNet</Text>
            <Text>{longDate(issuedAt)}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 27 }}>
          <View style={{ width: 66, height: 66, borderRadius: 18, backgroundColor: TILE, alignItems: 'center', justifyContent: 'center' }}>
            {shield
              ? <Image src={shield} style={{ width: 50, height: 50, objectFit: 'contain' }} />
              : <Text style={{ fontFamily: 'Google Sans Flex', fontWeight: 700, fontSize: 20, color: SECONDARY }}>{initials(institution.name)}</Text>}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 10.5, fontWeight: 500, color: SECONDARY }}>Bienvenidos a HaNet</Text>
            <Text style={styles.display}>{institution.fullName || institution.name}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Tu institución en HaNet</Text>
          <View style={{ borderTopWidth: 0.75, borderTopColor: LINE }}>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.row} wrap={false}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.code} wrap={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: 700 }}>Código de invitación</Text>
            {data.generatedAt && <Text style={{ fontSize: 9, color: '#dddde2' }}>Generado el {longDate(data.generatedAt)}, {new Date(data.generatedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</Text>}
          </View>
          {words
            ? <Text style={{ fontFamily: 'Google Sans Flex', fontWeight: 700, fontSize: 28, letterSpacing: -0.4, marginBottom: 10 }}>{words.join('  ·  ')}</Text>
            : <Text style={{ fontFamily: 'Google Sans Flex', fontWeight: 700, fontSize: 20, marginBottom: 10 }}>La frase se entregó al generarla</Text>}
          <Text style={{ fontSize: 9.75, lineHeight: '14pt', color: '#dddde2' }}>
            {words
              ? 'Con estas cuatro palabras, las personas de la nómina se unen a su liceo desde la app. Si este código se pierde o se filtra, entra a panel.hanet.muxp.art con una cuenta de administración y genera otro en Mi institución, pestaña Código de invitación: el actual deja de funcionar al instante. Quienes ya se unieron no se ven afectados.'
              : 'Por seguridad, HaNet no guarda la frase: aparece solo en el documento que se descargó al generarla. Si se perdió, la administración del liceo o el equipo HaNet generan otra desde el panel.'}
          </Text>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.h2}>Webs de HaNet</Text>
          <View style={styles.tiles}>
            {[
              [qrs.app, 'App web', 'app.hanet.muxp.art'],
              [qrs.panel, 'Panel web', 'panel.hanet.muxp.art'],
              [qrs.docs, 'Guías y docs', 'docs.hanet.muxp.art'],
            ].map(([qr, title, url]) => (
              <View key={title} style={[styles.tile, { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9 }]}>
                <View style={{ padding: 3, borderRadius: 7, backgroundColor: '#ffffff' }}>
                  <Image src={qr} style={{ width: 44, height: 44 }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 700 }}>{title}</Text>
                  <Text style={{ color: SECONDARY, marginTop: 2, fontSize: 8.25 }}>{url}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        {footer(1)}
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.top}>
          <HanetLogotype />
          <Text style={{ fontSize: 9, fontWeight: 700 }}>{institution.name}</Text>
        </View>
        <View style={{ marginTop: 14, gap: 4 }}>
          <Text style={styles.display}>Primeros pasos</Text>
          <Text style={{ fontSize: 10.5, color: SECONDARY }}>Empieza a usar HaNet en tu institución.</Text>
        </View>

        <View style={{ marginTop: 14, borderTopWidth: 0.75, borderTopColor: LINE }}>
          {steps.map(([title, body], index) => (
            <View key={title} style={styles.step} wrap={false}>
              <View style={[styles.stepNumber, { backgroundColor: index === 0 ? PINK : INK }]}>
                <Text style={{ color: '#ffffff', fontFamily: 'Google Sans Flex', fontWeight: 700, fontSize: 12 }}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 12, padding: 12, borderRadius: 15, borderWidth: 0.75, borderColor: LINE }} wrap={false}>
          <Text style={{ fontSize: 11.25, fontWeight: 700, marginBottom: 4 }}>¿Algo no funciona?</Text>
          <Text style={styles.stepBody}>Escríbenos a muxp@muxp.art. El estado de HaNet y las mantenciones están en status.hanet.muxp.art. La nómina tiene datos de menores de edad: compártela solo con el equipo HaNet y por un medio privado.</Text>
        </View>
        {footer(2)}
      </Page>
    </Document>
  )
}

/** Arma el PDF y lo descarga. */
export async function downloadInscriptionPdf(data: InscriptionData) {
  registerFonts()
  const issuedAt = Date.now()
  const [shield, app, panel, docs] = await Promise.all([
    urlToDataUrl(data.institution.logoUrl),
    qrPng('https://app.hanet.muxp.art'),
    qrPng('https://panel.hanet.muxp.art'),
    qrPng('https://docs.hanet.muxp.art/'),
  ])
  const blob = await pdf(<InscriptionDocument data={data} shield={shield} qrs={{ app, panel, docs }} issuedAt={issuedAt} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Inscripción a HaNet · ${data.institution.name}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
