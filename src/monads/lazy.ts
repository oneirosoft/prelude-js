/**
 * Lazy is a monad that allows for lazy evaluation of computations.
 * It is useful for deferring computation until the value is needed.
 * It can be used to create memoized values or to chain computations
 */

import { id } from "../fns";

export type Lazy<T> = {
    get: () => T;
    toString: () => string;
    toJSON: () => T;
};

/**
 * Create a lazily-evaluated computation.
 * Value is memoized after the first call.
 */
export const lazy = <T>(fn: () => T): Lazy<T> => {
    let value: T;
    let isEvaluated = false;
    const get = () => {
        if (!isEvaluated) {
            value = fn();
            isEvaluated = true;
        }
        return value;
    };
    return {
        get,
        toString: () => `Lazy(${String(get())})`,
        toJSON: () => get(),
    };
};

/**
 * Apply a function to the result of a Lazy computation.
 */
export const map = <T, U>(fn: (value: T) => U) => (lazyValue: Lazy<T>): Lazy<U> =>
    lazy(() => fn(lazyValue.get()));

/**
 * Chain Lazy computations.
 */
export const flatMap = <T, U>(fn: (value: T) => Lazy<U>) => (lazyValue: Lazy<T>): Lazy<U> =>
    fn(lazyValue.get());

/**
 * Run a side effect with the resolved value.
 */
export const iter = <T>(fn: (value: T) => void) => (lazyValue: Lazy<T>): void =>
    fn(lazyValue.get());

/**
 * Extract the result of the Lazy computation.
 */
export const unwrap = <T>(lazyValue: Lazy<T>): T => lazyValue.get();

/**
 * Run a side effect with the resolved value and return the Lazy computation.
 */
export const tap = <T>(fn: (value: T) => void) => (lazyValue: Lazy<T>): Lazy<T> => {
    iter(fn)(lazyValue);
    return lazyValue;
}

export const flatten = <T>(lazyValue: Lazy<Lazy<T>>): Lazy<T> =>
    flatMap(id<Lazy<T>>)(lazyValue);

const Lazy = {
    create: lazy,
    map,
    flatMap,
    iter,
    unwrap,
    tap,
    flatten
};

export default Lazy;