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
export function compose<A, B>(ab: (a: A) => B): (a: A) => B;
export function compose<A, B, C>(bc: (b: B) => C, ab: (a: A) => B): (a: A) => C;
export function compose<A, B, C, D>(cd: (c: C) => D, bc: (b: B) => C, ab: (a: A) => B): (a: A) => D;
export function compose<A, B, C, D, E>(de: (d: D) => E, cd: (c: C) => D, bc: (b: B) => C, ab: (a: A) => B): (a: A) => E;
export function compose<A, B, C, D, E, F>(ef: (e: E) => F, de: (d: D) => E, cd: (c: C) => D, bc: (b: B) => C, ab: (a: A) => B): (a: A) => F;
export function compose<A, B, C, D, E, F, G>(fg: (f: F) => G, ef: (e: E) => F, de: (d: D) => E, cd: (c: C) => D, bc: (b: B) => C, ab: (a: A) => B): (a: A) => G;
export function compose<A, B, C, D, E, F, G, H>(gh: (g: G) => H, fg: (f: F) => G, ef: (e: E) => F, de: (d: D) => E, cd: (c: C) => D, bc: (b: B) => C, ab: (a: A) => B): (a: A) => H;
export function compose<A, B, C, D, E, F, G, H, I>(hi: (h: H) => I, gh: (g: G) => H, fg: (f: F) => G, ef: (e: E) => F, de: (d: D) => E, cd: (c: C) => D, bc: (b: B) => C, ab: (a: A) => B): (a: A) => I;
export function compose<A, B, C, D, E, F, G, H, I, J>(ij: (i: I) => J, hi: (h: H) => I, gh: (g: G) => H, fg: (f: F) => G, ef: (e: E) => F, de: (d: D) => E, cd: (c: C) => D, bc: (b: B) => C, ab: (a: A) => B): (a: A) => J;
export function compose(...fns: Array<(x: any) => any>) {
    return (value: unknown) => fns.reduceRight((acc, fn) => fn(acc), value);
}