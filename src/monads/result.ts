import { compose } from "../compose"
import { noop } from "../fns"

/**
 * Represents a successful result.
 */
type Ok<T> = {
  readonly type: 'OK',
  readonly value: T
  readonly toJSON: () => {
    readonly type: 'OK',
    readonly value: T
  }
}

/**
 * Represents a failed result.
 */
type Error<T> = {
  readonly type: 'ERROR',
  readonly error: T
  readonly toJSON: () => {
    readonly type: 'ERROR',
    readonly error: T
  }
}

/**
 * Represents a computation that can either succeed or fail.
 */
export type Result<T, E> = Ok<T> | Error<E>

/**
 * Create a successful Result.
 * @param value - The success value.
 * @returns A Result of type OK.
 */
export const ok = <T>(value: T): Result<T, never> =>
  ({ type: 'OK', value, toJSON: () => ({ type: 'OK', value }) })

/**
 * Create an error Result.
 * @param error - The error value.
 * @returns A Result of type ERROR.
 */
export const error = <T>(error: T): Result<never, T> =>
  ({ type: 'ERROR', error, toJSON: () => ({ type: 'ERROR', error }) })

/**
 * Check if the Result is OK.
 */
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> =>
  result.type === 'OK'

/**
 * Check if the Result is an Error.
 */
export const isError = <T, E>(result: Result<T, E>): result is Error<E> =>
  result.type === 'ERROR'

/**
 * Flat-map over a successful result.
 * @param fn - Function that returns a new Result from the value.
 * @returns A function that applies the transformation or propagates the error.
 */
export const flatMap = <T, E, R>(fn: (value: T) => Result<R, E>) =>
  (result: Result<T, E>) => isOk(result) ? fn(result.value) : error(result.error)

/**
 * Flat-map over both success and error paths.
 */
export const biFlatMap = <T, E, R, U>(
  ok: (value: T) => Result<R, U>,
  error: (error: E) => Result<R, U>
) => (result: Result<T, E>) =>
    isOk(result) ? ok(result.value) : error(result.error)

/**
 * Map over a successful result.
 * @param fn - Function to transform the success value.
 */
export const map = <T, E, R>(fn: (value: T) => R) =>
  flatMap(compose(ok, fn))

/**
 * Map over both success and error paths.
 * @param okFn - Function to transform the success value.
 * @param errorFn - Function to transform the error value.
 */
export const biMap = <T, E, R, U>(okFn: (value: T) => R, errorFn: (error: E) => U) =>
  biFlatMap(compose(ok, okFn), compose(error, errorFn))

/**
 * Fold the result into a single value.
 * @param ok - Function for OK case.
 * @param error - Function for ERROR case.
 * @returns A function that returns the folded value.
 */
export const fold = <T, E, R>(ok: (value: T) => R, error: (error: E) => R) =>
  (result: Result<T, E>) => isOk(result) ? ok(result.value) : error(result.error)

/**
 * Alias for fold.
 */
export const match = fold

/**
 * Get the success value or return a default if error.
 * @param defaultValue - The fallback value.
 */
export const getOrElse = <T, E>(defaultValue: T) =>
  fold(x => x, _ => defaultValue)

/**
 * Run a side-effect if OK.
 */
export const iter = <T, E>(fn: (value: T) => void) => (result: Result<T, E>) => {
  if (isOk(result))
    fn(result.value)
}

/**
 * Run a side-effect based on success or failure.
 */
export const biIter = <T, E>(ok: (value: T) => void, error: (error: E) => void) =>
  (result: Result<T, E>) => {
    if (isOk(result)) ok(result.value)
    else error(result.error)
  }

/**
 * Filter a Result based on a predicate applied to the success value.
 * If the predicate fails, converts to an Error.
 */
export const filter = <T, E>(fn: (value: T) => boolean) =>
  (result: Result<T, E>) =>
    isOk(result) && fn(result.value)
      ? ok(result.value)
      : error('Failed filter condition')

/**
 * Run a side-effect if OK (alias for biIter with noop on error).
 */
export const ifOk = <T, E>(fn: (value: T) => void) => biIter(noop, fn)

/**
 * Run a side-effect if Error (alias for biIter with noop on ok).
 */
export const ifError = <T, E>(fn: (error: E) => void) => biIter(noop, fn)

/**
 * Run a side-effect if OK and return the original result.
 */
export const tap = <T, E>(fn: (value: T) => void) => (result: Result<T, E>) => {
  iter(fn)(result)
  return result
}

/**
 * Extract only the success values from an array of Results.
 * @param results - Array of Result values.
 * @returns Array of unwrapped OK values.
 */
export const compact = (results: Result<unknown, unknown>[]) =>
  results.filter(isOk).map(x => x.value)
