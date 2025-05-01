import { compose } from './compose';
import { none, optional, type Option } from './monads/option';
import { not } from './ops';

/**
 * Identity function that returns the input value unchanged.
 *
 * This is useful as a default callback or in functional composition.
 *
 * @param x - The value to return.
 * @returns The input value `x`.
 *
 * @example
 * const value = id(42); // 42
 */
export const id = <T>(x: T): T => x;

/**
 * Asynchronous identity function.
 *
 * Returns a resolved `Promise` of the input value.
 * Useful in async pipelines or default async callbacks.
 *
 * @param x - The value to resolve.
 * @returns A `Promise` that resolves to `x`.
 *
 * @example
 * await idAsync('hello'); // 'hello'
 */
export const idAsync = async <T>(x: T): Promise<T> => x;

/**
 * Alias for `idAsync`, the asynchronous identity function.
 *
 * @see idAsync
 */
export const identityAsync = idAsync;

/**
 * Alias for `id`, the identity function.
 *
 * @see id
 */
export const identity = id;

/**
 * A no-operation function.
 *
 * Does nothing and returns `undefined`. Useful as a placeholder callback
 * or default function when no action is required.
 *
 * @example
 * noop(); // undefined
 */
export const noop = (): void => { };

/**
 * Memoizes a function by caching the result based on its arguments.
 *
 * Uses a nested `Map`/`WeakMap` structure (trie) for better performance and memory efficiency
 * compared to stringifying arguments. Object and function arguments use `WeakMap` to avoid
 * memory leaks; primitives use `Map`.
 *
 * Suitable for functions with a fixed number of arguments and deterministic outputs.
 *
 * @template T - Function type.
 * @param fn - The function to memoize.
 * @returns A new function with memoization applied.
 *
 * @example
 * const add = (a: number, b: number) => a + b;
 * const memoizedAdd = memoize(add);
 *
 * memoizedAdd(1, 2); // 3 (calls original)
 * memoizedAdd(1, 2); // 3 (from cache)
 *
 * const obj = { x: 1 };
 * const memoObjFn = memoize((o: object) => o.x);
 * memoObjFn(obj); // Uses WeakMap internally
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
    const root = new Map<any, any>();

    return function (...args: Parameters<T>): ReturnType<T> {
        let current: any = root;

        for (const arg of args) {
            const isObject = arg !== null && (typeof arg === 'object' || typeof arg === 'function');
            const mapType = isObject ? WeakMap : Map;

            if (!current.has(arg))
                current.set(arg, new mapType());
            current = current.get(arg);
        }

        if (!current.has('result'))
            current.set('result', fn(...args));

        return current.get('result');
    } as T;
};

/**
 * Ensures a function is only called once.
 *
 * Subsequent calls return the result of the first invocation,
 * regardless of the arguments passed.
 *
 * Useful for initialization functions or one-time setup logic.
 *
 * @template T - Function type
 * @param fn - The function to wrap
 * @returns A function that calls `fn` only once
 *
 * @example
 * const initialize = once(() => console.log("Initialized"));
 * initialize(); // Logs "Initialized"
 * initialize(); // No output
 */
export const once = <T extends (...args: any[]) => any>(fn: T): T => {
    let called = false;
    let result: ReturnType<T>;

    return function (...args: Parameters<T>): ReturnType<T> {
        if (!called) {
            called = true;
            result = fn(...args);
        }
        return result;
    } as T;
}

/**
 * Ensures an async function is only called once.
 *
 * Subsequent calls return the result of the first invocation's `Promise`,
 * even if called with different arguments. Useful for one-time async initializations.
 *
 * @template T - The type of the async function.
 * @param fn - The async function to wrap.
 * @returns A new function that calls `fn` only once.
 *
 * @example
 * const fetchOnce = onceAsync(() => fetch('/data'));
 * await fetchOnce(); // fetches from server
 * await fetchOnce(); // returns same promise/result, no second request
 */
export const onceAsync = <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
    let called = false;
    let result: Promise<ReturnType<T>>;

    return async function (...args: Parameters<T>): Promise<ReturnType<T>> {
        if (!called) {
            called = true;
            result = fn(...args);
        }
        return result;
    } as T;
};

export const toPromise = <T>(value: T): Promise<T> =>
    value instanceof Promise
        ? value
        : new Promise(resolve => resolve(value));

/**
 * Create a function that always returns the same value.
 */
export const always = <T>(value: T): (() => T) => () => value;

/**
 * Creates a predicate that checks if a value is one of the specified allowed values.
 *
 * Useful for validating membership in a finite set, such as enums or string literals.
 *
 * @template T - The type of the values to compare
 * @param values - A list of allowed values
 * @returns A function that checks if a given value is included in the allowed list
 *
 * @example
 * const isPrimaryColor = oneOf('red', 'blue', 'yellow');
 * isPrimaryColor('red');   // true
 * isPrimaryColor('green'); // false
 */
export const oneOf =
  <T extends readonly [unknown, ...unknown[]]>(...values: T) =>
  (value: T[number]): boolean =>
    values.includes(value);

/**
 * Creates a predicate that checks if a value is equal to all provided values.
 *
 * Returns `true` if the input value strictly equals (`===`) every value in the list.
 * Useful for enforcing consistency or validating that a value matches a constant set.
 *
 * @template T - The type of the input and comparison values
 * @param values - A list of values to compare against
 * @returns A function that takes a value and returns `true` if it is equal to all provided values
 *
 * @example
 * const isAllA = equalsAll('a', 'a', 'a');
 * isAllA('a'); // true
 * isAllA('b'); // false
 *
 * const isConsistent = equalsAll(42, 42);
 * isConsistent(42); // true
 * isConsistent(41); // false
 */
export const equalsAll = <T>(...values: Array<T>) => (value: T): boolean =>
    values.every(v => v === value);

/**
 * Checks if a value is `null` or `undefined`.
 *
 * Acts as a type guard so that TypeScript narrows the type when `false`.
 *
 * @param value - The value to check.
 * @returns `true` if the value is `null` or `undefined`, otherwise `false`.
 *
 * @example
 * const x: string | null = 'hello';
 * if (!isNil(x)) {
 *   // x is now of type string
 *   console.log(x.toUpperCase());
 * }
 */
export function isNil<T>(value: T): value is Extract<T, null | undefined> {
    return value === null || value === undefined;
}

/**
 * Conditionally applies a transformation if the value is `null` or `undefined`.
 *
 * If the input is `null` or `undefined`, applies the `fn` transformation.
 * Otherwise, returns the input value unchanged.
 *
 * @template T - Type of the input and output value
 * @param fn - Function to run when the input is nil
 * @returns A function that takes a value and transforms it only if it's nil
 *
 * @example
 * const defaultToZero = ifNil(() => 0);
 * defaultToZero(null); // 0
 * defaultToZero(5);    // 5
 */
export const ifNil = <T>(fn: (value: T) => T) => (value: T): T =>
    isNil(value) ? fn(value) : value;

/**
 * Transforms a value if it's not `null` or `undefined`, otherwise returns a fallback.
 *
 * Useful when working with nullable values and a default is needed for missing data.
 *
 * @template T - Input value type
 * @template U - Output value type
 * @param fallback - The value to return if the input is `null` or `undefined`
 * @param fn - The transformation function to apply if the value is not nil
 * @returns A function that maps or falls back based on the value's nullish state
 *
 * @example
 * const getLength = mapOrIfNil(0, (s: string) => s.length);
 * getLength("hello");  // 5
 * getLength(undefined) // 0
 */
export const mapOrIfNil = <T, U>(fallback: U, fn: (value: T) => U) => (value: T): U =>
    isNil(value) ? fallback : fn(value);

/**
 * Checks that a value is *not* `null` or `undefined`.
 *
 * Acts as a type guard to narrow the type to exclude `null | undefined`.
 *
 * @param value - The value to check.
 * @returns `true` if value is not `null` or `undefined`.
 *
 * @example
 * const y: number | undefined = 5;
 * if (isNotNil(y)) {
 *   // y is number here
 *   console.log(y + 2);
 * }
 */
export const isNotNil = <T>(value: T): value is Exclude<T, null | undefined> =>
    value !== null && value !== undefined;

/**
 * Conditionally applies a transformation if the input is not `null` or `undefined`.
 *
 * Useful in pipelines where you want to skip transformation when a value is "nil".
 *
 * @template T - The type of the input and output.
 * @param fn - A function to apply to the value if it is not `null` or `undefined`.
 * @returns A new function that applies `fn` only when the input is not nil.
 *
 * @example
 * const doubleIfPresent = ifNotNil((x: number) => x * 2);
 * doubleIfPresent(5); // 10
 * doubleIfPresent(null); // null
 * doubleIfPresent(undefined); // undefined
 */
export const ifNotNil = <T>(fn: (value: T) => T) => (value: T): T =>
    isNotNil(value) ? fn(value) : value;

/**
 * Applies a transformation function to a value if it is not `null` or `undefined`,
 * otherwise returns a fallback value.
 *
 * This is useful for safely handling optional values while still applying
 * a transformation when possible.
 *
 * @template T - Input value type (possibly null or undefined).
 * @template U - Output value type.
 *
 * @param fallback - The value to return if input is `null` or `undefined`.
 * @param fn - A function to apply to the input if it is not nil.
 * @returns A function that either applies `fn` or returns the fallback.
 *
 * @example
 * const getLength = mapOrIfNotNil(0, (s: string) => s.length);
 * getLength("hello"); // 5
 * getLength(null);    // 0
 */
export const mapOrIfNotNil = <T, U>(fallback: U, fn: (value: T) => U) => (value: T): U =>
    isNotNil(value) ? fn(value) : fallback;

/**
 * Applies a side-effect function to a value and returns the original value.
 *
 * Useful for logging, debugging, or performing effects inside a functional pipeline
 * without interrupting the data flow.
 *
 * @template T - The type of the input value.
 * @param fn - A function to execute with the value. The return value of `fn` is ignored.
 * @returns A function that takes a value, calls `fn(value)` for side-effects, and returns the original value.
 *
 * @example
 * pipe(
 *   [1, 2, 3],
 *   tap(arr => console.log('Before map:', arr)),
 *   map(x => x * 2),
 *   tap(arr => console.log('After map:', arr))
 * );
 */
export const tap = <T>(fn: (value: T) => void) => (value: T): T => {
    fn(value);
    return value;
}

/**
 * Retrieve the value of a property from an object.
 *
 * @param key - The key to access on the object.
 * @returns A function that takes an object and returns the value at `key`.
 *
 * @example
 * const getName = prop('name');
 * getName({ name: 'Alice', age: 30 }); // "Alice"
 */
export const prop = <T, K extends keyof T>(key: K) =>
    (obj: T): T[K] => obj[key];

/**
 * Retrieve the value of a property from an object or return a fallback if it's undefined or null.
 *
 * @param key - The key to access on the object.
 * @param fallback - The value to return if the result is null or undefined.
 * @returns A function that takes an object and returns the value at `key` or the fallback.
 *
 * @example
 * const getAge = propOr('age', 18);
 * getAge({ name: 'Alice' }); // 18
 */
export const propOr = <T, K extends keyof T, Fallback>(key: K, fallback: Fallback) =>
    (obj: T): T[K] | Fallback => {
        const value = obj[key];
        return value ?? fallback;
    };

/**
 * Conditionally applies a transformation based on predicates, returning an `Option<R>`.
 *
 * Evaluates each predicate in order. If a predicate returns `true`,
 * its corresponding transformer is applied and the result is wrapped in `Option.some`.
 * If no predicate matches, returns `Option.none`.
 *
 * This function supports multiple arguments and provides type inference for both
 * predicates and transformations.
 *
 * @template A - Argument types as a tuple.
 * @template R - Return type of the matched transformer.
 *
 * @param pairs - An array of [predicate, transformer] pairs.
 *   Each predicate receives the full argument list and, if true, causes the transformer to be run.
 *
 * @returns A curried function that takes arguments and returns `Option<R>`.
 *
 * @example
 * import { cond } from './cond';
 * import { unwrap, isNone } from './option';
 *
 * const classify = cond(
 *   [(x: number) => x === 0, () => 'zero'],
 *   [(x: number) => x > 0, x => `positive: ${x}`],
 *   [(x: number) => x < 0, x => `negative: ${x}`],
 * );
 *
 * const result = classify(1);  // Option.some("positive: 1")
 * if (!isNone(result)) {
 *   console.log(unwrap(result)); // "positive: 1"
 * }
 *
 * const noneResult = classify(NaN); // Option.none
 */
export function cond<A extends any[], R>(
    ...pairs: Array<[(...args: A) => boolean, (...args: A) => R]>
): (...args: A) => Option<R> {
    return (...args: A): Option<R> => {
        for (const [predicate, transform] of pairs) {
            if (predicate(...args)) return optional(transform(...args));
        }
        return none;
    };
}

/**
 * Like `cond`, but returns a fallback value if no predicate matches.
 *
 * Evaluates each predicate in order. If a predicate returns true,
 * its corresponding transformer is applied to the same arguments.
 * If no match is found, the fallback value is returned.
 *
 * @template A - Tuple of argument types
 * @template R - Return type
 *
 * @param fallback - The value to return if no predicate matches
 * @param pairs - Array of [predicate, transform] pairs
 *
 * @example
 * const classify = condOr('unknown',
 *   [(x: number) => x === 0, () => 'zero'],
 *   [(x: number) => x > 0, x => `positive: ${x}`],
 * );
 *
 * classify(-1); // → "unknown"
 */
export function condOr<A extends any[], R>(
    fallback: R | ((...args: A) => R),
    ...pairs: Array<[(...args: A) => boolean, (...args: A) => R]>
): (...args: A) => R {
    return (...args: A): R => {
        for (const [predicate, transform] of pairs) {
            if (predicate(...args)) return transform(...args);
        }
        return isFunction(fallback) ? fallback(...args) : fallback;
    };
}

/**
 * Returns `true` if the given number is even.
 *
 * @param n - The number to check.
 * @returns `true` if `n` is divisible by 2 without a remainder.
 *
 * @example
 * isEven(2); // true
 * isEven(5); // false
 */
export const isEven = (n: number): boolean => n % 2 === 0;

/**
 * Returns `true` if the given number is odd.
 *
 * This is defined as the logical negation of `isEven`.
 *
 * @param n - The number to check.
 * @returns `true` if `n` is not divisible by 2.
 *
 * @example
 * isOdd(3); // true
 * isOdd(4); // false
 */
export const isOdd = compose(not, isEven);

/**
 * Checks if a value is a function.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a function, otherwise `false`.
 *
 * @example
 * isFunction(() => {}); // true
 * isFunction(42);       // false
 */
export const isFunction = (value: unknown): value is (...args: any[]) => any =>
    typeof value === 'function';

/**
 * Determines whether a value is a non-null, non-array object.
 *
 * This type guard returns `true` if the value is:
 * - Not `null` or `undefined`
 * - Of type `"object"`
 * - Not an array
 *
 * This is useful for narrowing `unknown` values to plain objects (e.g., `{ [key: string]: unknown }`).
 *
 * @param value - The value to test.
 * @returns `true` if the value is a non-null object and not an array.
 *
 * @example
 * isObject({ a: 1 });       // true
 * isObject(null);           // false
 * isObject([1, 2, 3]);      // false
 * isObject("hello");        // false
 * isObject(undefined);      // false
 * isObject({});             // true
 */
export const isObject = (value: unknown): value is Record<string, unknown> =>
    isNotNil(value) && typeof value === 'object' && !Array.isArray(value);