import { isFunction, isNil } from "./fns";
import { when } from "./when";
import Seq from "./seq";

/**
 * Curried discriminant-based pattern matching with optional selector.
 *
 * Allows safe matching against a discriminant (e.g. `.kind`) from a value, and applies
 * a handler based on the discriminant. Optionally supports a fallback handler.
 *
 * @template T - The input type to match against.
 * @template D - The type of the discriminant value (e.g. a union of string literals).
 * @template R - The result type returned from a matching handler.
 *
 * @param selector - A function to extract the discriminant from a value.
 * @param cases - Object where keys are discriminants and values are handlers.
 * @param fallback - Optional fallback handler if no match is found.
 *
 * @returns A function that takes the input value and returns the matched result.
 *
 * @example
 * type Shape = { kind: 'circle', radius: number } | { kind: 'square', size: number };
 *
 * const area = matchWithGuard(
 *   s => s.kind,
 *   {
 *     circle: s => Math.PI * s.radius ** 2,
 *     square: s => s.size ** 2,
 *   }
 * );
 *
 * const result = area({ kind: 'circle', radius: 2 }); // 12.566...
 */
export function matchWithGuard<
    T extends Record<K, string | number | symbol>,
    K extends keyof T,
    R
>(
    selector: (value: T) => T[K],
    cases: Partial<{ [V in T[K]]: (value: Extract<T, Record<K, V>>) => R }>,
    fallback?: (value: T) => R
): (value: T) => R {
    return (value: T): R => {
        const discriminant = selector(value);
        const handler = cases[discriminant];

        if (handler) {
            return handler(value as Extract<T, Record<K, typeof discriminant>>);
        }

        if (fallback) {
            return fallback(value);
        }

        throw new Error(`No match found for discriminant: ${String(discriminant)}`);
    };
}

/**
 * Pattern-matching function that mimics a type-safe switch expression.
 *
 * Accepts a list of `[matchValue, resultOrFn]` pairs and returns a function
 * that takes a value and produces the corresponding result. Supports both
 * static values and functions as results.
 *
 * If no match is found, an optional fallback value or function is used.
 * If neither match nor fallback exists, an error is thrown.
 *
 * @template T - Type of the match input.
 * @template R - Type of the result.
 *
 * @param cases - Array of `[value, result or result function]` pairs.
 * @param fallback - Optional fallback result or function.
 * @returns A function that accepts a value and returns the corresponding result.
 *
 * @example
 * const getStatusIcon = matchWith([
 *   ['success', '✅'],
 *   ['error', '❌'],
 *   ['loading', () => '⏳']
 * ], '❓');
 *
 * getStatusIcon('success'); // ✅
 * getStatusIcon('loading'); // ⏳
 * getStatusIcon('unknown'); // ❓
 *
 * @example
 * const describe = matchWith<number, string>([
 *   [0, 'zero'],
 *   [1, () => 'one']
 * ], n => `unknown: ${n}`);
 *
 * describe(2); // 'unknown: 2'
 */
export const matchWith = <T, R>(
    cases: Array<[T, R | ((val: T) => R)]>,
    fallback?: R | ((val: T) => R)
) => (value: T): R => {
    const whenIsFunction = when(isFunction, (f: any) => f(value));
    
    const filtered = Seq.fromArray(cases)
        .filter(([match, _]) => match === value)
    
    for (const [, result] of filtered) {
        return whenIsFunction(result);
    }

    if (isNil(fallback))
        throw new Error(`No match found for value: ${String(value)}`);

    return whenIsFunction(fallback);
};