"use client"

import { useCallback, useState, useTransition } from "react"
import {
  isNextRedirectError,
  isNextRedirectMessage,
  safeErrorMessage,
} from "@lib/util/is-next-redirect"

type ServerAction<TInput, TOutput> = (input: TInput) => Promise<TOutput> | TOutput

export function useServerAction<TInput, TOutput>(
  action: ServerAction<TInput, TOutput>
) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<TOutput | null>(null)

  const execute = useCallback(
    (input: TInput) => {
      setError(null)
      startTransition(async () => {
        try {
          const output = await action(input)
          // Some server actions mistakenly return redirect tokens as strings.
          if (isNextRedirectMessage(output)) {
            return
          }
          setResult(output)
        } catch (err) {
          if (isNextRedirectError(err)) {
            throw err
          }
          setError(new Error(safeErrorMessage(err, "Something went wrong")))
        }
      })
    },
    [action]
  )

  return { execute, isPending, error, result }
}
