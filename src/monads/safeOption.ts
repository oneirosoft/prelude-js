import { fail } from "../err";
import { condOr, id } from "../fns";
import { whenDo } from "../when";
import type { Either } from "./either";
import type { Optional } from "./option";
import E from "./either";
import {
    none,
    optional,
    unwrap as unwrapOption
} from "./option";
import type { SafeResult } from "./safe";
import S from "./safe";
import { compose } from "../compose";
import { pipe } from "../pipe";

/**
 * Represents a failure in a computation, with an optional cause.
 */
type Failure = {
    readonly type: 'FAILURE',
    readonly cause?: unknown,
    readonly toJson: () => {
        readonly type: 'FAILURE',
        readonly cause?: unknown,
    }
}

/**
 * A union of a successful Option<T> or a computation-level Failure.
 */
export type ResultOption<T> = Failure | Optional<T>;

/**
 * Wraps a value in a SafeOption. Null or undefined values become None.
 */
const success = <T>(value: T | null | undefined): ResultOption<T> =>
    optional(value) as ResultOption<T>;

/**
 * Constructs a failure SafeOption from an error or unknown cause.
 */
const failure = (cause: unknown): ResultOption<never> => ({
    type: 'FAILURE',
    cause,
    toJson: () => ({
        type: 'FAILURE',
        cause,
    }),
});

/**
 * Attempts to execute a function and wrap the result in a SafeOption.
 * Returns a Failure if an exception is thrown.
 */
export const attempt = <T>(fn: () => T | null | undefined): ResultOption<T> => {
    try {
        return success(fn());
    } catch (e) {
        return failure(e);
    }
}

/**
 * Type guard for checking if a SafeOption is a Some.
 */
export const isSome = <T>(safe: ResultOption<T>): safe is Optional<T> =>
    safe.type === 'SOME';

/**
 * Type guard for checking if a SafeOption is a None.
 */
export const isNone = <T>(safe: ResultOption<T>): safe is Optional<T> =>
    safe.type === 'NONE';

/**
 * Type guard for checking if a SafeOption is a Failure.
 */
export const isError = <T>(safe: ResultOption<T>): safe is Failure =>
    safe.type === 'FAILURE';

/**
 * Applies a function to the unwrapped value if Some, returning a new SafeOption.
 * Propagates None and Failure unchanged.
 */
export const flatMap = <T, U>(fn: (value: T) => ResultOption<U>) => (safe: ResultOption<T>): ResultOption<U> =>
    isSome(safe) ? fn(unwrap(safe)) : safe;

/**
 * Transforms the unwrapped value inside a Some using a mapping function.
 * Propagates None and Failure unchanged.
 */
export const map = <T, U>(fn: (value: T) => U) =>
    flatMap((value: T) => success(fn(value)));

/**
 * Folds a SafeOption into a single value by providing handlers for
 * Success (Some), None, and Failure cases.
 */
export const fold = <T, U>(
    onSuccess: (value: T) => U,
    onNone: () => U,
    onFailure: (error: Failure) => U
) => condOr(
    s => onFailure(s as Failure),
    [(safe: ResultOption<T>) => isSome(safe), compose(onSuccess, unwrap)],
    [isNone, onNone]
);

/**
 * Alias for `fold`, provides pattern matching behavior.
 */
export const match = fold;

/**
 * Unwraps the value from a Some, or throws if None or Failure.
 */
export const unwrap = <T>(safe: ResultOption<T>): T =>
    isSome(safe)
        ? unwrapOption(safe)
        : fail('Cannot unwrap failure or none');

/**
 * Unwraps the value or returns a default value if None or Failure.
 */
export const unwrapOrElse = <T>(defaultValue: T) =>
    fold(id<T>, () => defaultValue, _ => defaultValue);

/**
 * Runs a side effect if the value is Some.
 */
export const iter = <T>(fn: (value: T) => void) =>
    whenDo(isSome, compose(fn, unwrap<any>));

/**
 * Runs a side effect if the value is Some, returns the SafeOption.
 */
export const tap = <T>(fn: (value: T) => void) => (safe: ResultOption<T>): ResultOption<T> => {
    iter(fn)(safe);
    return safe;
}

/**
 * Executes a side effect if the SafeOption is Some.
 */
export const ifSome = <T>(fn: (value: T) => void) =>
    whenDo(isSome, (s: ResultOption<T>) => pipe(s, unwrap, fn));

/**
 * Executes a side effect if the SafeOption is None.
 */
export const ifNone = (fn: () => void) => whenDo(isNone, fn)

/**
 * Executes a side effect if the SafeOption is a Failure.
 */
export const ifFailure = <T>(fn: (error: Failure) => void) =>
    whenDo(isError, fn) as ((s: ResultOption<T>) => void)

/**
 * Recovers from a Failure by transforming the error into a value wrapped in Some.
 */
export const recover = <T>(fn: (error: Failure) => T) =>
    condOr(id, [isError, compose(success, fn)]) as ((value: ResultOption<T>) => ResultOption<T>);

/**
 * Recovers from a Failure by providing an alternate SafeOption.
 */
export const recoverWith = <T>(fn: (error: Failure) => ResultOption<T>) =>
    condOr(id, [isError, fn]) as ((value: ResultOption<T>) => ResultOption<T>);

/**
 * Filters out all None and Failure values and unwraps the Some values.
 */
export const compact = <T>(safes: IteratorObject<ResultOption<T>>): IteratorObject<T> =>
    safes.filter(isSome).map(unwrap);

/**
 * Flattens a nested SafeOption<SafeOption<T>> into a single SafeOption<T>.
 */
export const flatten = <T>(safe: ResultOption<ResultOption<T>>): ResultOption<T> =>
    flatMap(id<ResultOption<T>>)(safe);

/**
 * Converts a SafeOption<T> into a plain Option<T>,
 * discarding Failure values by returning `none`.
 */
export const toOption = <T>(safe: ResultOption<T>): Optional<T> =>
    condOr(
        none,
        [isSome, s => s as Optional<T>],
    )(safe)

/**
 * Converts a SafeOption<T> into an Either<Failure, Option<T>>.
 * - If `safe` is Some or None, returns Right(safe).
 * - If `safe` is Failure, returns Left(Failure).
 */
export const toEither = <T>(safe: ResultOption<T>): Either<Failure, Optional<T>> =>
    isSome(safe) || isNone(safe) ? E.right(safe) : E.left(safe);

/**
 * Converts a SafeOption<T> into a Safe<T>:
 * - If Some, returns a successful Safe<T>.
 * - If None, returns a failure (cannot unwrap None).
 * - If Failure, wraps the thrown Failure into a Safe<T>.
 */
export const toSafe =
    condOr(
        (s: ResultOption<unknown>) => S.attempt(() => { throw s }),
        [isSome, s => S.attempt(() => unwrap(s))],
        [isNone, () => S.attempt(() => fail('Cannot unwrap None'))],
    );

/**
 * Functional utility module for working with SafeOption<T>.
 */
const SafeOption = {
    attempt,
    isSome,
    isNone,
    isError,
    unwrap,
    unwrapOrElse,
    flatMap,
    map,
    fold,
    match,
    iter,
    tap,
    recover,
    recoverWith,
    ifSome,
    ifNone,
    ifFailure,
    compact,
    flatten,
    toOption,
    toEither,
    toSafe,
}

export default SafeOption;
