/**
 * Performs a deep equality check between two values of the same type.
 *
 * Supports:
 * - Primitive values
 * - NaN
 * - Arrays
 * - Dates
 * - Plain objects (non-cyclic)
 *
 * @param a - The first value to compare
 * @returns A function that accepts the second value and returns true if they are deeply equal
 *
 * @example
 * isEqual({ a: 1 })( { a: 1 }) // true
 * isEqual([1, 2, 3])([1, 2, 3]) // true
 * isEqual(NaN)(NaN) // true
 * isEqual(new Date("2023-01-01"))(new Date("2023-01-01")) // true
 * isEqual({ a: 1 })({ a: 2 }) // false
 */
export const isEqual = <T>(a: T) => (b: T): boolean => {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return Number.isNaN(a) && Number.isNaN(b)
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => isEqual(item)(b[i]))
  }

  const keysA = Object.keys(a) as (keyof T)[]
  const keysB = Object.keys(b) as (keyof T)[]
  if (keysA.length !== keysB.length) return false

  return keysA.every(key => isEqual(a[key])(b[key]))
}

/**
 * A utility function that always returns true.
 * Commonly used as a default predicate.
 *
 * @param _ - Any input (ignored)
 * @returns true
 *
 * @example
 * stubTrue() // true
 * stubTrue('anything') // true
 */
export const stubTrue = (_: any) => true

/**
 * A utility function that always returns false.
 * Commonly used as a default predicate.
 *
 * @param _ - Any input (ignored)
 * @returns false
 *
 * @example
 * stubFalse() // false
 * stubFalse(123) // false
 */
export const stubFalse = (_: any) => false

/**
 * Creates a shallow predicate function that checks if a target object matches the provided source fields.
 * Comparison is shallow and strict (`===`).
 *
 * @param source - A partial object with fields to match
 * @returns A function that accepts a full object and returns true if all fields in source match
 *
 * @example
 * const isAdmin = matches({ role: 'admin' })
 * isAdmin({ role: 'admin', name: 'Jane' }) // true
 * isAdmin({ role: 'user' }) // false
 */
export const matches = <T extends Record<string, any>>(source: Partial<T>) =>
  (object: T): boolean =>
    Object.entries(source).every(([key, value]) => object[key as keyof T] === value)


/**
 * Creates a deep predicate function that checks if a target object deeply matches the provided source structure.
 * Uses `isEqual` internally for deep value comparison.
 *
 * @param source - A partial object to match deeply
 * @returns A function that accepts a full object and returns true if all fields in source deeply match
 *
 * @example
 * const isUserAdmin = deepMatches({
 *   meta: { roles: ['admin'] }
 * })
 *
 * isUserAdmin({
 *   name: 'Jane',
 *   meta: { roles: ['admin'], active: true }
 * }) // true
 *
 * isUserAdmin({
 *   name: 'Jane',
 *   meta: { roles: ['user'] }
 * }) // false
 */
export const deepMatches = <T>(source: Partial<T>) => (target: T): boolean =>
  Object.entries(source).every(([key, value]) => {
    const k = key as keyof T
    return isEqual(value)(target[k])
  })
