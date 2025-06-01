import { compose } from "../compose";
import Err from "../err";
import { condOr, id, prop } from "../fns";
import { whenDo } from "../when";
import { pipe } from "../pipe";
import type { Either } from "./either";
import E from "./either";
import { none, optional, some, type Optional } from "./option";

/**
 * Represents an application-level error with a cause.
 * 
 * Extends a structured Error with an additional cause field,
 * capturing the original thrown value or underlying issue.
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
 * Represents a successful computation with a value of type T.
 */
type Success<T> = {
    readonly type: 'SUCCESS',
    readonly value: T,
    readonly toJson: () => {
        readonly type: 'SUCCESS',
        readonly value: T,
    }
}

/**
 * Represents a computation that may either fail with an AppError or succeed with a value of type T.
 */
export type SafeResult<T> = Failure | Success<T>

const success = <T>(value: T): SafeResult<T> =>
({
    type: 'SUCCESS',
    value,
    toJson: () => ({
        type: 'SUCCESS',
        value,
    })
})


const failure = (cause: unknown): SafeResult<never> =>
({
    type: 'FAILURE',
    cause,
    toJson: () => ({
        type: 'FAILURE',
        cause,
    }),
});

/**
 * Executes a function safely, wrapping the result in an Either.
 * 
 * If the function succeeds, returns a Right<T>.
 * If it throws, captures the error as an AppError in a Left.
 * 
 * @param fn - The function to execute safely.
 * @returns An Either containing an AppError or the successful result.
 */
export const attempt = <T>(fn: () => T): SafeResult<T> => {
    try {
        return success(fn());
    } catch (error) {
        return failure(error);
    }
}

/**
 * Transforms the successful result inside a Safe<T> using a mapping function.
 * 
 * @param fn - Function to transform the success value.
 */
export const map = <T, U>(fn: (value: T) => U) =>
    flatMap((value: T) => success(fn(value)));

/**
 * Chains computations that may fail.
 * 
 * Applies a function to the successful value that returns a new Safe<U>.
 * 
 * @param fn - Function returning a new Safe<U>.
 */
export const flatMap = <T, U>(fn: (value: T) => SafeResult<U>) => (safe: SafeResult<T>): SafeResult<U> =>
    isSuccess(safe) ? fn(safe.value) : failure(safe.cause);

/**
 * Folds a Safe<T> into a single value by providing handlers for both failure and success cases.
 * 
 * @param onError - Function to handle the AppError.
 * @param onSuccess - Function to handle the success value.
 */
export const fold = <T, U>(onSuccess: (value: T) => U, onError: (error: Failure) => U) => (safe: SafeResult<T>): U =>
    isSuccess(safe) ? onSuccess(safe.value) : onError(safe);

/**
 * Pattern matches over a Safe<T>.
 * Alias for fold.
 * 
 * @param onError - Function to handle the AppError.
 * @param onSuccess - Function to handle the success value.
 */
export const match = fold

/**
 * Checks if the Safe<T> is an error (Left).
 */
export const isError = <T>(safe: SafeResult<T>): safe is Failure =>
    safe.type === 'FAILURE';

/**
 * Checks if the Safe<T> is a success (Right).
 */
export const isSuccess = <T>(safe: SafeResult<T>): safe is Success<T> =>
    safe.type === 'SUCCESS';

/**
 * Extracts the successful value, or returns a default if Safe<T> is an error.
 * 
 * @param defaultValue - Default value to return on error.
 */
export const unwrapOr = <T>(defaultValue: T) =>
    fold(id, () => defaultValue)

/**
 * Recovers from an AppError by transforming it into a successful value.
 * 
 * Useful for providing fallback values in case of failure.
 * 
 * @param fn - Function to transform an AppError into a success value.
 */
export const recover = <T>(fn: (error: Failure) => T) =>
    condOr(id, [isError, compose(success, fn)]) as ((value: SafeResult<T>) => SafeResult<T>);

/**
 * Recovers from an AppError by producing a new Safe<T> computation.
 * 
 * Useful for retrying or substituting alternate computations.
 * 
 * @param fn - Function that returns a new Safe<T> based on the error.
 */
export const recoverWith = <T>(fn: (error: Failure) => SafeResult<T>) =>
    condOr(id, [isError, fn]) as ((value: SafeResult<T>) => SafeResult<T>);

/**
 * Executes a side-effect if the Safe<T> is an error.
 * 
 * @param fn - Function to run with the AppError.
 */
export const ifFailure = <T>(fn: (error: Failure) => void) =>
    whenDo(isError, fn) as (value: SafeResult<T>) => void;

/**
 * Executes a side-effect if the Safe<T> is a success.
 * 
 * @param fn - Function to run with the successful value.
 */
export const ifSuccess = <T>(fn: (value: T) => void) =>
    whenDo(isSuccess, (s: Success<T>) => pipe(s, prop('value'), fn)) as ((value: SafeResult<T>) => void);

/**
 * Unwraps the Safe<T>, throwing an error if it is an AppError.
 */
export const unwrap = <T>(safe: SafeResult<T>): T => {
    if (isError(safe)) {
        throw Err.create('Unwrapping a failed Safe<T>');
    }
    return safe.value;
};

/**
 * Filters an array of Safe<T> values, returning only the successful ones unwrapped.
 * 
 * @param safes - Array of Safe<T> values.
 * @returns Array of unwrapped successful values.
 */
export const compact = (safes: Array<SafeResult<any>>): Array<any> =>
    safes.filter(isSuccess).map(unwrap);

/**
 * Performs a side-effect with the successful value.
 */
export const iter = <T>(fn: (value: T) => void) => (safe: SafeResult<T>): void =>
    whenDo(isSuccess, compose(fn, unwrap<any>))(safe);

/**
 * Performs a side-effect with both the successful value and the error.
 */
export const biIter = <T, U>(onSuccess: (value: T) => void, onFailure: (error: Failure) => void) => (safe: SafeResult<T>): void =>
    isSuccess(safe) ? onSuccess(safe.value) : onFailure(safe);

/**
 * Performs a side-effect with the successful value and returns the Safe<T>.
 */
export const tap = <T>(fn: (value: T) => void) => (safe: SafeResult<T>): SafeResult<T> => {
    iter(fn)(safe);
    return safe;
}

/**
 * Flattens a nested Safe<T> structure into a single Safe<T>.
 */
export const flatten = <T>(safe: SafeResult<SafeResult<T>>): SafeResult<T> =>
    flatMap(id<SafeResult<T>>)(safe);

/**
 * Converts a Safe<T> to an Either<Failure, T>.
 */
export const toEither = <T>(safe: SafeResult<T>): Either<Failure, T> =>
    isSuccess(safe) ? E.right(safe.value) : E.left(safe);

/**
 * Converts a Safe<T> to an Option<T>.
 */
export const toOption =
    condOr(
        none,
        [isSuccess, compose(optional, unwrap)],
    )

const Safe = {
    attempt,
    map,
    flatMap,
    fold,
    match,
    isError,
    isSuccess,
    unwrap,
    unwrapOr,
    recover,
    recoverWith,
    ifFailure,
    ifSuccess,
    compact,
    tap,
    iter,
    biIter,
    flatten
}

export default Safe
