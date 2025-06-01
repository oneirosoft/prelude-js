import { filter, map, some } from "./monads/option";

/**
 * Compose a series of functions from right to left.
 *
 * This is the functional equivalent of `f(g(h(x)))`, allowing you to write
 * pipelines of transformations that apply in reverse order. It is often
 * used when the final result should be applied to a value later (as in
 * `compose(f, g, h)(value)`), or when writing point-free functional code.
 *
 * Composition is lazy — it returns a new function that can be applied to a value.
 * This is especially useful for defining reusable data transformation pipelines.
 *
 * @example
 * ```ts
 * const trim = (s: string) => s.trim();
 * const toUpper = (s: string) => s.toUpperCase();
 * const exclaim = (s: string) => `${s}!`;
 *
 * const shout = compose(exclaim, toUpper, trim);
 * const result = shout("  hello  ");
 * // result: "HELLO!"
 * ```
 *
 * @template R The final return type after all functions have been composed
 * @param fns A variadic list of functions where each output is compatible with the next input
 * @returns A function that applies the composed transformations right-to-left
 */

/**
 * Compose a series of functions from right to left.
 * 
 * Allows chaining of functions where each output becomes the input of the previous.
 * Safely handles cases where types may change (e.g., Option<T> => T).
 */

// Overloads for strong type inference

/**
 * Compose a series of functions from right to left.
 * 
 * Allows chaining of functions where each output becomes the input of the previous.
 * Safely handles cases where types may change (e.g., Option<T> => T).
 */

// Overloads for strong type inference
export function compose<A, B>(fn1: (a: A) => B): (a: A) => B;
export function compose<A, B, C>(fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => C;
export function compose<A, B, C, D>(fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => D;
export function compose<A, B, C, D, E>(fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => E;
export function compose<A, B, C, D, E, F>(fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => F;
export function compose<A, B, C, D, E, F, G>(fn6: (f: F) => G, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => G;
export function compose<A, B, C, D, E, F, G, H>(fn7: (g: G) => H, fn6: (f: F) => G, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => H;
export function compose<A, B, C, D, E, F, G, H, I>(fn8: (h: H) => I, fn7: (g: G) => H, fn6: (f: F) => G, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => I;
export function compose<A, B, C, D, E, F, G, H, I, J>(fn9: (i: I) => J, fn8: (h: H) => I, fn7: (g: G) => H, fn6: (f: F) => G, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => J;
export function compose<A, B, C, D, E, F, G, H, I, J, K>(fn10: (j: J) => K, fn9: (i: I) => J, fn8: (h: H) => I, fn7: (g: G) => H, fn6: (f: F) => G, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => K;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L>(fn11: (k: K) => L, fn10: (j: J) => K, fn9: (i: I) => J, fn8: (h: H) => I, fn7: (g: G) => H, fn6: (f: F) => G, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => L;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M>(fn12: (l: L) => M, fn11: (k: K) => L, fn10: (j: J) => K, fn9: (i: I) => J, fn8: (h: H) => I, fn7: (g: G) => H, fn6: (f: F) => G, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => M;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(fn13: (m: M) => N, fn12: (l: L) => M, fn11: (k: K) => L, fn10: (j: J) => K, fn9: (i: I) => J, fn8: (h: H) => I, fn7: (g: G) => H, fn6: (f: F) => G, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => N;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(fn14: (n: N) => O, fn13: (m: M) => N, fn12: (l: L) => M, fn11: (k: K) => L, fn10: (j: J) => K, fn9: (i: I) => J, fn8: (h: H) => I, fn7: (g: G) => H, fn6: (f: F) => G, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => O;
export function compose(...fns: Array<(x: any) => any>): (value: any) => any {
    return (value: unknown) => {
        return fns.reduceRight((acc, fn) => fn(acc), value);
    };
}

