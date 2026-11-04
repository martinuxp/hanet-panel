import { useCallback, useEffect, useState } from 'react'
import { describeError } from '@/lib/errors'

/** Carga algo del backend al montar (y cuando cambian `deps`), con reintento. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[], fallbackError: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setError(null)
    load()
      .then(result => { if (active) setData(result) })
      .catch(failure => { if (active) setError(describeError(failure, fallbackError)) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const retry = useCallback(() => {
    setData(null)
    setAttempt(value => value + 1)
  }, [])

  /** Vuelve a pedir los datos sin vaciar la pantalla mientras llegan. */
  const refresh = useCallback(() => setAttempt(value => value + 1), [])

  return { data, setData, error, retry, refresh }
}
