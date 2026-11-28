import '@fontsource-variable/dm-sans/opsz.css'
import type { CSSProperties, ReactNode } from 'react'
import { renderSVG } from 'uqr'

// Imágenes "Bienvenidos a HaNet" para redes, recreadas del Figma de muxp
// (archivo 16jIXkcIKhFJPnM38A7qUF, secciones "Social new inst." y "9:16 16:9").
// Cada una se dibuja en el tamaño de Figma y se exporta al de la red: el
// carrusel 4:5 a 1080 × 1350, la historia 9:16 a 1080 × 1920 y la 16:9 a
// 1920 × 1080. Por liceo cambian solo el nombre corto y el escudo.

export const SLIDE_WIDTH = 914
export const SLIDE_HEIGHT = 1142

export type PromoData = { name: string; shield: string | null }

const W = SLIDE_WIDTH
const H = SLIDE_HEIGHT
const asset = (file: string) => `${import.meta.env.BASE_URL}promo/${file}`
const FONT = "'DM Sans Variable', 'DM Sans', sans-serif"
const OPSZ: CSSProperties = { fontFamily: FONT, fontVariationSettings: '"opsz" 14' }

function Abs({ style, children }: { style: CSSProperties; children?: ReactNode }) {
  return <div style={{ position: 'absolute', ...style }}>{children}</div>
}

function Img({ src, style }: { src: string; style?: CSSProperties }) {
  return <img alt="" src={asset(src)} draggable={false} style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', maxWidth: 'none', ...style }} />
}

/** Una capa girada como las exporta Figma: caja exterior, caja interior centrada y girada, imagen con margen negativo. */
function Rotated({ left, top, width, height, transform, innerWidth, innerHeight, inset, src, center, blend }: {
  left: number; top: number; width: number; height: number; transform: string
  innerWidth: number; innerHeight: number; inset: string; src: string; center?: boolean; blend?: CSSProperties['mixBlendMode']
}) {
  return (
    <Abs style={{ left, top, width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: center ? 'translateX(-50%)' : undefined, mixBlendMode: blend }}>
      <div style={{ flex: 'none', transform }}>
        <div style={{ position: 'relative', width: innerWidth, height: innerHeight }}>
          <div style={{ position: 'absolute', inset }}>
            <Img src={src} style={{ position: 'static' }} />
          </div>
        </div>
      </div>
    </Abs>
  )
}

/** Fondo común: negro con la luz rosa abajo. `icon` agrega la H grande de fondo. */
function Background({ icon }: { icon?: 'tilted' | 'big' }) {
  return (
    <>
      <Rotated left={-677.85} top={H * 0.4 + 170.09} width={1867.289} height={1477.445} transform="rotate(-153.09deg) scaleY(-1)" innerWidth={1688} innerHeight={800} inset="-43.39% -20.56%" src="blob-30.svg" />
      <Rotated left={-863} top={114} width={2481.811} height={2351.929} transform="rotate(-146.7deg) scaleY(-1) skewX(-0.91deg)" innerWidth={1908.422} innerHeight={1577.081} inset="-22.01% -18.19%" src="blob-29.svg" />
      {icon === 'tilted' && <Rotated center blend="hard-light" left={W / 2 + 19.16} top={235} width={1184.315} height={1589.859} transform="rotate(-7.91deg)" innerWidth={991.797} innerHeight={1467.316} inset="-0.54% -0.35%" src="icon-big-1.svg" />}
      {icon === 'big' && <Rotated center left={W * 0.7 + 1.73} top={-99} width={2093.058} height={2454.903} transform="rotate(22.64deg)" innerWidth={1402.514} innerHeight={2074.952} inset="-0.39% -0.25%" src="icon-big.svg" />}
      <Rotated left={-705.83} top={175.19} width={2400.524} height={2094.971} transform="rotate(-153.09deg) scaleY(-1)" innerWidth={2020} innerHeight={1324} inset="-26.22% -17.18%" src="blob-28.svg" />
    </>
  )
}

function Logotype() {
  return <Abs style={{ left: 60, top: 60, width: 143, height: 54 }}><Img src="logotype.svg" /></Abs>
}

function NextButton({ left }: { left: number }) {
  return (
    <Abs style={{ left, top: H * 0.8 + 100.4, width: 126, height: 68, transform: 'rotate(180deg) scaleY(-1)', borderRadius: 360, background: 'var(--hn-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 56, height: 56 }}><Img src="arrow.svg" /></div>
    </Abs>
  )
}

/** Título de paso: número en círculo y título grande, centrados en y = 217,5. */
function StepTitle({ step, children }: { step: 1 | 2 | 3; children: ReactNode }) {
  return (
    <>
      <Abs style={{ left: 60, top: 195, width: 45, height: 45 }}><Img src={`step-${step}.svg`} /></Abs>
      <Abs style={{ ...OPSZ, left: 120, top: 217.5, transform: 'translateY(-50%)', fontSize: 96, fontWeight: 800, lineHeight: 0.783, letterSpacing: -8.64, whiteSpace: 'nowrap', color: 'var(--hn-text-primary)' }}>
        {children}
      </Abs>
    </>
  )
}

function Body({ width, tracking, children }: { width: number; tracking: number; children: ReactNode }) {
  return (
    <Abs style={{ ...OPSZ, left: 60, top: H * 0.2 + 45.6, width, fontSize: 36, fontWeight: 400, lineHeight: 0.941, letterSpacing: tracking, color: 'var(--hn-text-primary)' }}>
      {children}
    </Abs>
  )
}

/** Reemplaza las insignias de tiendas mientras HaNet no está en ellas. */
function WebPill({ style }: { style: CSSProperties }) {
  return (
    <Abs style={{ ...OPSZ, height: 52, padding: '0 24px', borderRadius: 360, background: 'var(--hn-surface)', color: 'var(--hn-text-primary)', fontSize: 24, fontWeight: 600, letterSpacing: -0.6, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', ...style }}>
      app.hanet.muxp.art
    </Abs>
  )
}

function Frame({ width = W, height = H, children }: { width?: number; height?: number; children: ReactNode }) {
  return <div style={{ position: 'relative', width, height, overflow: 'hidden', background: 'var(--hn-promo-ink)' }}>{children}</div>
}

function Shield({ name, shield, style }: PromoData & { style: CSSProperties }) {
  return (
    <Abs style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      {shield
        ? <img alt="" src={shield} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        : <span style={{ ...OPSZ, fontSize: Number(style.height) * 0.38, fontWeight: 800, color: 'var(--hn-text-primary)' }}>{initials(name)}</span>}
    </Abs>
  )
}

/** HaNet × escudo, en chico (historia y 16:9). */
function Duo({ left, top, ...data }: PromoData & { left: number; top: number }) {
  return (
    <>
      <Abs style={{ left, top, width: 52, height: 76 }}><Img src="icon.svg" /></Abs>
      <Abs style={{ left: left + 70, top: top + 31, width: 14, height: 14 }}><Img src="x.svg" /></Abs>
      <Shield {...data} style={{ left: left + 102.36, top, width: 55.04, height: 75.85 }} />
    </>
  )
}

const QR_URL = 'https://app.hanet.muxp.art'
const qrSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderSVG(QR_URL, { border: 0, whiteColor: '#ffffff', blackColor: '#000000' }))}`

function Qr({ size, radius, style }: { size: number; radius: number; style: CSSProperties }) {
  return (
    <Abs style={{ width: size, height: size, padding: size * 0.0652, background: '#ffffff', borderRadius: radius, ...style }}>
      <img alt="" src={qrSrc} style={{ display: 'block', width: '100%', height: '100%' }} />
    </Abs>
  )
}

function InstallAt({ size, style }: { size: number; style: CSSProperties }) {
  return (
    <Abs style={{ ...OPSZ, transform: 'translateY(-50%)', fontSize: size, fontWeight: 700, lineHeight: 0.783, letterSpacing: -0.09 * size, whiteSpace: 'pre', color: 'var(--hn-text-primary)', ...style }}>
      <p style={{ margin: 0 }}>Instala</p>
      <p style={{ margin: 0 }}>HaNet en</p>
      <p style={{ margin: 0, color: 'var(--hn-accent)' }}>app.hanet.muxp.art</p>
    </Abs>
  )
}

function Hello({ name, max, style }: { name: string; max: number; style: CSSProperties }) {
  const hello = `¡Hola ${name}!`
  // 48 px caben unos `max` caracteres; si el nombre es más largo, se achica.
  const size = hello.length > max ? Math.max(28, Math.round(48 * max / hello.length)) : 48
  return <Abs style={{ ...OPSZ, fontSize: size, lineHeight: 'normal', letterSpacing: -0.07 * size, whiteSpace: 'nowrap', color: 'var(--hn-text-primary)', ...style }}>{hello}</Abs>
}

function BigWelcome({ style }: { style: CSSProperties }) {
  return (
    <Abs style={{ ...OPSZ, fontSize: 128, fontWeight: 800, lineHeight: 0.783, letterSpacing: -11.52, whiteSpace: 'nowrap', color: 'var(--hn-text-primary)', ...style }}>
      <p style={{ margin: 0 }}>Bienvenidos</p>
      <p style={{ margin: 0 }}>a <span style={{ color: 'var(--hn-accent)' }}>HaNet</span></p>
    </Abs>
  )
}

function Tagline({ style }: { style: CSSProperties }) {
  return (
    <Abs style={{ ...OPSZ, width: 653, fontSize: 33, lineHeight: 0.941, letterSpacing: -2.64, color: 'var(--hn-text-primary)', ...style }}>
      La app para <b style={{ fontWeight: 700 }}>estudiantes</b> que te mantiene al día con tu institución.
    </Abs>
  )
}

const PHONE = { width: 453, height: 912 }
function Phones({ back, front }: { back: [number, number]; front: [number, number] }) {
  return (
    <>
      <Abs style={{ left: back[0] - 30, top: back[1] - 30, ...PHONE }}><Img src="phone-1a.webp" /></Abs>
      <Abs style={{ left: front[0] - 30, top: front[1] - 30, ...PHONE, filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))' }}><Img src="phone-1b.webp" /></Abs>
    </>
  )
}

const STORY = { width: 914, height: 1624 }
const WIDE = { width: 1528, height: 860 }

/** Historia 9:16: luz rosa arriba y abajo, todo centrado. */
function Story(data: PromoData) {
  const { width: SW, height: SH } = STORY
  return (
    <Frame {...STORY}>
      <Rotated left={-985.16} top={SH * 0.6 + 54.49} width={2045.646} height={1477.445} transform="rotate(-155.14deg) scaleY(-1) skewX(-4.22deg)" innerWidth={1817.36} innerHeight={816.241} inset="-42.52% -19.1%" src="story-blob-30.svg" />
      <Rotated left={-1188} top={SH * 0.2 + 304.2} width={2718.866} height={2351.929} transform="rotate(-149.05deg) scaleY(-0.99) skewX(-5.73deg)" innerWidth={2037.483} innerHeight={1626.211} inset="-21.34% -17.04%" src="story-blob-29.svg" />
      <Rotated left={-1015.81} top={SH * 0.4 + 40.59} width={2629.814} height={2094.971} transform="rotate(-155.14deg) scaleY(-1) skewX(-4.22deg)" innerWidth={2174.803} innerHeight={1350.878} inset="-25.69% -15.96%" src="story-blob-28.svg" />
      <Rotated left={-192.61} top={-1000.3} width={2034.663} height={1300.65} transform="rotate(17.33deg) scaleY(-1) skewX(-4.22deg)" innerWidth={1817.36} innerHeight={816.241} inset="-42.52% -19.1%" src="story-blob-31.svg" />
      <Rotated left={-643.71} top={-1484.47} width={2661.83} height={2229.983} transform="rotate(23.42deg) scaleY(-0.99) skewX(-5.73deg)" innerWidth={2037.483} innerHeight={1626.211} inset="-21.34% -17.04%" src="story-blob-32.svg" />
      <Rotated left={-716.67} top={-1238.25} width={2572.269} height={1904.407} transform="rotate(17.33deg) scaleY(-1) skewX(-4.22deg)" innerWidth={2174.803} innerHeight={1350.878} inset="-25.69% -15.96%" src="story-blob-33.svg" />
      <Phones back={[162, SH * 0.4 + 201.4]} front={[SW * 0.2 + 176.2, SH * 0.6 + 149.6]} />
      <Hello name={data.name} max={30} style={{ left: SW / 2, top: 249, transform: 'translateX(-50%)' }} />
      <BigWelcome style={{ left: SW / 2 + 0.5, top: 327, transform: 'translateX(-50%)', textAlign: 'center' }} />
      <Duo {...data} left={SW * 0.4 + 12.4} top={157} />
      <Tagline style={{ left: SW / 2 + 0.5, top: SH * 0.2 + 218.2, transform: 'translateX(-50%)', textAlign: 'center' }} />
      <InstallAt size={32} style={{ left: SW * 0.6 + 36.6, top: SH * 0.6 + 84.1 }} />
      <Qr size={125} radius={10} style={{ left: 585, top: 887 }} />
    </Frame>
  )
}

/** 16:9 (pantallas, web del liceo, YouTube): texto a la derecha, QR y teléfonos a la izquierda. */
function Wide(data: PromoData) {
  const { width: WW, height: WH } = WIDE
  return (
    <Frame {...WIDE}>
      <Rotated left={-493.85} top={WH * 0.2 + 126.89} width={1867.289} height={1477.445} transform="rotate(-153.09deg) scaleY(-1)" innerWidth={1688} innerHeight={800} inset="-43.39% -20.56%" src="blob-30.svg" />
      <Rotated left={-679} top={-101} width={2481.811} height={2351.929} transform="rotate(-146.7deg) scaleY(-1) skewX(-0.91deg)" innerWidth={1908.422} innerHeight={1577.081} inset="-22.01% -18.19%" src="blob-29.svg" />
      <Rotated left={-521.83} top={-39.81} width={2400.524} height={2094.971} transform="rotate(-153.09deg) scaleY(-1)" innerWidth={2020} innerHeight={1324} inset="-26.22% -17.18%" src="blob-28.svg" />
      <BigWelcome style={{ right: WW - 1430, top: WH * 0.2 + 110, textAlign: 'right' }} />
      <Hello name={data.name} max={30} style={{ right: WW - 1430, top: 200, textAlign: 'right' }} />
      <Tagline style={{ right: WW - 1430, top: WH * 0.6 - 14, textAlign: 'right' }} />
      <Phones back={[100, WH * 0.4 + 132]} front={[WW * 0.2 + 76.4, WH * 0.8 + 17]} />
      <Duo {...data} left={WW * 0.8 + 50.6} top={WH * 0.6 + 68} />
      <Abs style={{ left: 100, top: 100, width: 177, height: 67 }}><Img src="logotype.svg" /></Abs>
      <Qr size={157} radius={0} style={{ left: 100, top: 243 }} />
      <InstallAt size={40} style={{ left: 277, top: WH * 0.2 + 181.5 }} />
    </Frame>
  )
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]?.toUpperCase()).join('')
}

function Welcome({ name, shield }: PromoData) {
  const hello = `¡Hola ${name}!`
  const helloSize = hello.length > 30 ? Math.max(28, Math.round(48 * 30 / hello.length)) : 48
  return (
    <Frame>
      <Background icon="tilted" />
      <Abs style={{ ...OPSZ, right: W - 854, top: 188, fontSize: helloSize, lineHeight: 'normal', letterSpacing: -3.36 * helloSize / 48, whiteSpace: 'nowrap', textAlign: 'right', color: 'var(--hn-text-primary)' }}>{hello}</Abs>
      <Abs style={{ ...OPSZ, right: W - 854, top: H * 0.2 + 21.6, fontSize: 128, fontWeight: 800, lineHeight: 0.783, letterSpacing: -11.52, whiteSpace: 'nowrap', textAlign: 'right', color: 'var(--hn-text-primary)' }}>
        <p style={{ margin: 0 }}>Bienvenidos</p>
        <p style={{ margin: 0 }}>a <span style={{ color: 'var(--hn-accent)' }}>HaNet</span></p>
      </Abs>
      <Abs style={{ ...OPSZ, right: W - 854, top: H * 0.4 + 15.2, width: 653, fontSize: 33, lineHeight: 0.941, letterSpacing: -2.64, textAlign: 'right', color: 'var(--hn-text-primary)' }}>
        La app para <b style={{ fontWeight: 700 }}>estudiantes</b> que te mantiene al día con tu institución.
      </Abs>
      <Abs style={{ left: 625, top: 577, width: 79, height: 117 }}><Img src="icon.svg" /></Abs>
      <Abs style={{ left: 732, top: 630, width: 9, height: 9 }}><Img src="x.svg" /></Abs>
      <Shield name={name} shield={shield} style={{ left: 769.29, top: 577, width: 84.74, height: 116.76 }} />
      <WebPill style={{ right: W - 854, top: 771 }} />
      <Logotype />
      <NextButton left={728} />
      <Abs style={{ left: 25, top: 588, width: 453, height: 912 }}><Img src="phone-1a.webp" /></Abs>
      <Abs style={{ left: 222, top: 861, width: 453, height: 912, filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))' }}><Img src="phone-1b.webp" /></Abs>
    </Frame>
  )
}

function Install({ name }: PromoData) {
  return (
    <Frame>
      <Background icon="big" />
      <Logotype />
      <Abs style={{ left: -466, top: H * 0.4 + 21.2, width: 1418, height: 942 }}><Img src="phones-2.webp" style={{ objectFit: 'cover' }} /></Abs>
      <NextButton left={728} />
      <StepTitle step={1}>Instala HaNet</StepTitle>
      <Body width={690} tracking={-2.88}>
        <p style={{ margin: 0 }}>Ahora <b style={{ fontWeight: 600 }}>{name} usa HaNet</b> para avisos, calendario de pruebas, material de clases, horarios y más.</p>
        <p style={{ margin: 0 }}>&nbsp;</p>
        <p style={{ margin: 0 }}>Entra a <b style={{ fontWeight: 700 }}>app.hanet.muxp.art</b> desde tu teléfono y agrégala a tu pantalla de inicio.</p>
      </Body>
    </Frame>
  )
}

function CreateId() {
  return (
    <Frame>
      <Background icon="big" />
      <Abs style={{ left: -165, top: H * 0.4 + 16.2, width: 1226, height: 872 }}><Img src="hand-3.webp" style={{ objectFit: 'cover' }} /></Abs>
      <Logotype />
      <NextButton left={728} />
      <Body width={714} tracking={-1.44}>
        <p style={{ margin: 0 }}>Ingresa tus datos y verifica tu correo. Después escribe el <b style={{ fontWeight: 700 }}>código de invitación de 4 palabras</b> de tu institución y confirma con tu correo institucional.</p>
        <p style={{ margin: 0 }}>(¡Nunca publiques el código en redes!)</p>
      </Body>
      <StepTitle step={2}>Crea tu HaNet ID</StepTitle>
      <Abs style={{ left: 565, top: 584, width: 289, height: 102 }}><Img src="code-pills.svg" /></Abs>
    </Frame>
  )
}

function Done({ name }: PromoData) {
  return (
    <Frame>
      <Background icon="big" />
      <Abs style={{ left: -144, top: H * 0.2 + 101.6, width: 1407.353, height: 1162.023, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ flex: 'none', transform: 'rotate(-11.1deg)' }}>
          <div style={{ position: 'relative', width: 1250, height: 939 }}><Img src="phones-4.webp" style={{ objectFit: 'cover' }} /></div>
        </div>
      </Abs>
      <Logotype />
      <NextButton left={60} />
      <Body width={736} tracking={-1.44}>
        <p style={{ margin: 0 }}>Ya puedes comenzar a descubrir todo lo que tiene {name} y HaNet para ti.</p>
        <p style={{ margin: 0 }}>&nbsp;</p>
        <p style={{ margin: 0 }}>¿Tienes dudas? Escríbenos en @hanetcl, muxp@muxp.art o entra a docs.hanet.muxp.art.</p>
        <p style={{ margin: 0 }}>&nbsp;</p>
        <p style={{ margin: 0 }}>¡Disfruta HaNet!</p>
      </Body>
      <StepTitle step={3}>¡Y listo!</StepTitle>
    </Frame>
  )
}

function Closing() {
  return (
    <Frame>
      <Background />
      <Abs style={{ left: W / 2 + 0.5, top: H / 2 + 0.5, width: 331, height: 125, transform: 'translate(-50%, -50%)' }}><Img src="logotype-big.svg" /></Abs>
      <WebPill style={{ left: '50%', top: H * 0.8 + 130, transform: 'translateX(-50%)' }} />
    </Frame>
  )
}

export type PromoFormat = '4:5' | '9:16' | '16:9'
export type PromoSlide = { id: string; label: string; format: PromoFormat; width: number; height: number; exportWidth: number; render: (data: PromoData) => ReactNode }

const CAROUSEL = { format: '4:5' as const, width: W, height: H, exportWidth: 1080 }

export const PROMO_SLIDES: PromoSlide[] = [
  { id: '1-bienvenidos', label: 'Bienvenidos', ...CAROUSEL, render: data => <Welcome {...data} /> },
  { id: '2-instala', label: 'Instala HaNet', ...CAROUSEL, render: data => <Install {...data} /> },
  { id: '3-hanet-id', label: 'Crea tu HaNet ID', ...CAROUSEL, render: () => <CreateId /> },
  { id: '4-listo', label: '¡Y listo!', ...CAROUSEL, render: data => <Done {...data} /> },
  { id: '5-cierre', label: 'Cierre', ...CAROUSEL, render: () => <Closing /> },
  { id: 'historia', label: 'Historia', format: '9:16', ...STORY, exportWidth: 1080, render: data => <Story {...data} /> },
  { id: 'horizontal', label: 'Horizontal', format: '16:9', ...WIDE, exportWidth: 1920, render: data => <Wide {...data} /> },
]
