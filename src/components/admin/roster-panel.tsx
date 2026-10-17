import { useMemo, useState } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { Textarea } from '@/components/arc/textarea/textarea'
import { describeError } from '@/lib/errors'
import { importRoster, parseRoster, plural, type AdminInstitution, type RosterImportResult } from '@/lib/hnt-admin'
import { reloadInstitutions } from '@/lib/use-institutions'

const COLUMNS = [
  ['rut', 'RUT'],
  ['nombres', 'Nombres'],
  ['apellidos', 'Apellidos'],
  ['curso', 'Curso'],
  ['email', 'Correo'],
] as const

export function RosterPanel({ institution }: { institution: AdminInstitution }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<(RosterImportResult & { headerRows: number }) | null>(null)
  const parsed = useMemo(() => parseRoster(text), [text])
  const preview = parsed.rows.slice(0, 5)

  const submit = async () => {
    if (parsed.rows.length === 0 || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const imported = await importRoster(institution.id, parsed.rows)
      setResult({ ...imported, headerRows: parsed.headerRows })
      if (imported.rejectedCount === 0) setText('')
      void reloadInstitutions()
    } catch (failure) {
      setError(describeError(failure, 'No pudimos cargar la nómina. Inténtalo nuevamente.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-(--radius-surface) bg-(--surface) p-6 shadow-(--shadow-resting)">
      <div className="flex flex-col gap-1">
        <h2 className="text-(length:--text-lg) font-medium">Cargar nómina</h2>
        <p className="text-(--text-secondary)">
          Copia las filas desde Excel o Sheets y pégalas aquí, una persona por línea, con las columnas en este orden: RUT, nombres, apellidos, curso y correo institucional.
        </p>
      </div>

      <Textarea
        label="Filas de la planilla"
        value={text}
        onChange={event => { setText(event.target.value); setResult(null); setError(null) }}
        placeholder={'12.345.678-5\tAna María\tPérez Soto\tSegundo Medio K\tana.perez@liceo.cl'}
        rows={8}
        spellCheck={false}
        disabled={busy}
        description={parsed.rows.length === 0
          ? 'Aún no hay filas.'
          : `${plural(parsed.rows.length, 'fila detectada', 'filas detectadas')}${parsed.headerRows ? ', sin contar el encabezado' : ''}.`}
      />

      {preview.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-(length:--text-sm) text-(--text-secondary)">Así se leyeron las primeras filas. Revisa que cada dato esté en su columna:</p>
          <div className="overflow-x-auto rounded-(--radius-panel) border border-(--border)">
            <table className="w-full text-left text-(length:--text-sm)">
              <thead className="bg-(--surface-muted) text-(--text-secondary)">
                <tr>{COLUMNS.map(([key, label]) => <th key={key} scope="col" className="px-3 py-2 font-medium whitespace-nowrap">{label}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index} className="border-t border-(--border-subtle)">
                    {COLUMNS.map(([key]) => (
                      <td key={key} className={`px-3 py-2 whitespace-nowrap ${row[key] ? '' : 'text-(--danger)'}`}>{row[key] || 'vacío'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Alert tone="danger" title="No se cargó la nómina" open={!!error}>{error}</Alert>
      <Alert
        tone={result?.rejectedCount ? 'warning' : 'success'}
        title={result ? (result.imported === 1 ? 'Se cargó 1 persona' : `Se cargaron ${result.imported.toLocaleString('es-CL')} personas`) : ''}
        open={!!result}
      >
        {!!result?.rejectedCount && (
          <div className="flex flex-col gap-1">
            <span>{result.rejectedCount === 1 ? '1 fila no se cargó:' : `${result.rejectedCount} filas no se cargaron:`}</span>
            <ul className="flex flex-col gap-0.5">
              {result.rejected.map(item => <li key={item.row}>Fila {item.row + result.headerRows}: {item.reason}</li>)}
            </ul>
          </div>
        )}
      </Alert>

      <Button onClick={() => void submit()} loading={busy} disabled={parsed.rows.length === 0} className="self-start">
        {parsed.rows.length > 0 ? `Cargar ${plural(parsed.rows.length, 'persona', 'personas')}` : 'Cargar nómina'}
      </Button>
    </section>
  )
}
