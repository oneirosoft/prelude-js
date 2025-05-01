/**
 * Pipes a value through a sequence of unary functions from left to right.
 *
 * This is a functional programming utility for composing operations in a readable, linear order.
 * Each function receives the result of the previous one.
 *
 * @template A - The initial input type.
 * @template Z - The final output type after all functions are applied.
 * @param value - The initial value to pass through the function chain.
 * @param fns - A list of functions that each take the output of the previous function.
 * @returns The final result after applying all functions in sequence.
 *
 * @example
 * const double = (x: number) => x * 2;
 * const square = (x: number) => x * x;
 * const stringify = (x: number) => x.toString();
 *
 * const result = pipe(3, double, square, stringify);
 * // double(3) => 6
 * // square(6) => 36
 * // stringify(36) => "36"
 * console.log(result); // "36"
 *
 * @example
 * // Using with objects
 * const setName = (obj: { name?: string }) => ({ ...obj, name: 'Alice' });
 * const greet = (obj: { name: string }) => `Hello, ${obj.name}!`;
 *
 * const result = pipe({}, setName, greet);
 * console.log(result); // "Hello, Alice!"
 */
export function pipe<A, B>(a: A, ab: (a: A) => B): B;
export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
export function pipe<A, B, C, D>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
export function pipe<A, B, C, D, E>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E): E;
export function pipe<A, B, C, D, E, F>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F): F;
export function pipe<A, B, C, D, E, F, G>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G): G;
export function pipe<A, B, C, D, E, F, G, H>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H): H;
export function pipe<A, B, C, D, E, F, G, H, I>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I): I;
export function pipe<A, B, C, D, E, F, G, H, I, J>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J): J;
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K): K;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L): L;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L, lm: (l: L) => M): M;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L, lm: (l: L) => M, mn: (m: M) => N): N;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L, lm: (l: L) => M, mn: (m: M) => N, no: (n: N) => O): O;
export function pipe(value: unknown, ...fns: Array<(x: any) => any>): any {
    return fns.reduce((acc, fn) => fn(acc), value);
}
