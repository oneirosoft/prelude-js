import { isNil } from "./fns";
import { tryCatch } from "./tryCatch";
import type { Nil } from "./types";

/**
 * Applies a transformation function to a value.
 *
 * This is a general-purpose value-level mapping function.
 * Useful in point-free or curried style when composing transformations.
 *
 * @param fn - A function to apply to the input value.
 * @returns A function that takes a value and returns the result of applying `fn`.
 *
 * @example
 * const getLength = select((s: string) => s.length);
 * getLength("hello"); // 5
 *
 * pipe("hello", select(s => s.toUpperCase())); // "HELLO"
 */
export const select = <T, U>(fn: (value: T) => U) =>
    (value: T): U => fn(value);

/**
 * Applies a transformation function to a value, or returns a fallback if the value is null or undefined.
 *
 * This is helpful for handling nullable values safely.
 *
 * @param fallback - A fallback value to return if input is `null` or `undefined`.
 * @param fn - A function to apply to the value if it's not nullish.
 * @returns A function that takes a possibly-nullish value and returns the transformed result or fallback.
 *
 * @example
 * const getLengthOrZero = selectOr(0, (s: string) => s.length);
 * getLengthOrZero("hello"); // 5
 * getLengthOrZero(null);    // 0
 * getLengthOrZero(undefined); // 0
 */
export const selectOr = <T, U>(fallback: U, fn: (value: T) => U) =>
    (value: T | Nil): U =>
        isNil(value) ? fallback : fn(value);

/**
 * Applies a transformation function to a value, wrapping the result in a try/catch to handle exceptions.
 *
 * This is useful when the function might throw (e.g. parsing, deep property access, etc.)
 * and you want to safely capture either the result or a fallback value.
 *
 * @param fn - A function to apply to the input value.
 * @param onError - A function that handles thrown errors and returns a fallback value.
 * @returns A function that safely applies `fn`, catching and recovering from errors.
 *
 * @example
 * const parseSafe = selectSafe(JSON.parse, () => ({}));
 * parseSafe('{ "x": 1 }'); // { x: 1 }
 * parseSafe('bad json');   // {}
 */
export const selectSafe = <T, U>(fn: (value: T) => U, onError: (e: unknown) => U) =>
    (value: T): U => tryCatch(() => fn(value), onError);