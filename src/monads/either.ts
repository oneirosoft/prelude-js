/**
 * A functional Either monad for representing computations that may fail.
 * Left represents failure, Right represents success.
 *
 * Provides combinators for mapping, flat-mapping, folding, and safe side-effects.
 */

import { id } from "../fns";

/** Represents a Left value (typically an error or failure). */
type Left<T> = {
  readonly type: 'LEFT',
  readonly value: T,
  readonly toJson: () => ['LEFT', T],
  readonly toString: () => string
}

/** Represents a Right value (typically a success or valid result). */
type Right<T> = {
  readonly type: 'RIGHT',
  readonly value: T,
  readonly toJson: () => ['RIGHT', T],
  readonly toString: () => string
}

/** Represents a value that can be either Left (error) or Right (success). */
export type Either<L, R> = Left<L> | Right<R>;

/**
 * Create a Left value.
 */
export const left = <L, R = never>(value: L): Either<L, R> => ({
  type: 'LEFT',
  value,
  toJson: () => ['LEFT', value],
  toString: () => JSON.stringify(['LEFT', value])
});

/**
 * Create a Right value.
 */
export const right = <L = never, R = never>(value: R): Either<L, R> => ({
  type: 'RIGHT',
  value,
  toJson: () => ['RIGHT', value],
  toString: () => JSON.stringify(['RIGHT', value])
});

/**
 * Check if an Either is a Left.
 */
export const isLeft = <L, R>(either: Either<L, R>): either is Left<L> =>
  either.type === 'LEFT';

/**
 * Check if an Either is a Right.
 */
export const isRight = <L, R>(either: Either<L, R>): either is Right<R> =>
  either.type === 'RIGHT';

/**
 * Map over a Right value. Left is passed through unchanged.
 */
export const map = <R, T>(fn: (value: R) => T) => <L>(either: Either<L, R>): Either<L, T> =>
  isLeft(either) ? either : right(fn(either.value));

/**
 * Map over a Left value. Right is passed through unchanged.
 */
export const mapLeft = <L, T>(fn: (value: L) => T) => <R>(either: Either<L, R>): Either<T, R> =>
  isRight(either) ? either : left(fn(either.value));

/**
 * Map over both Left and Right values.
 */
export const biMap = <L, R, LL, RR>(leftFn: (left: L) => LL, rightFn: (right: R) => RR) =>
  (either: Either<L, R>): Either<LL, RR> =>
    isLeft(either)
      ? left(leftFn(either.value))
      : right(rightFn(either.value));

/**
 * Flat-map over a Right value, chaining operations that return an Either.
 */
export const flatMap = <R, T>(fn: (value: R) => Either<any, T>) => <L>(either: Either<L, R>): Either<L, T> =>
  isLeft(either) ? either : fn(either.value);

/**
 * Flat-map over a Left value, chaining operations that return an Either.
 */
export const flatMapLeft = <L, T>(fn: (value: L) => Either<T, any>) => <R>(either: Either<L, R>): Either<T, R> =>
  isRight(either) ? either : fn(either.value);

/**
 * Fold an Either into a single value.
 */
export const fold = <L, R, T>(leftFn: (value: L) => T, rightFn: (value: R) => T) =>
  (either: Either<L, R>): T =>
    isLeft(either) ? leftFn(either.value) : rightFn(either.value);

/**
 * Alias for fold.
 */
export const match = fold;

/**
 * Unwraps the value inside a `Right` variant of an Either.
 * 
 * @param either - The Either value to unwrap.
 * @returns The `Right` value.
 * @throws If the Either is a `Left`, throws an Error describing the Left value.
 */
export const unwrap = <L, R>(either: Either<L, R>): R => {
  if (isLeft(either)) {
    throw new Error(`Cannot unwrap Left value: ${either.value}`);
  }
  return either.value;
}

/**
 * Unwraps the value inside a `Left` variant of an Either.
 * 
 * @param either - The Either value to unwrap.
 * @returns The `Left` value.
 * @throws If the Either is a `Right`, throws an Error describing the Right value.
 */
export const unwrapLeft = <L, R>(either: Either<L, R>): L => {
  if (isRight(either)) {
    throw new Error(`Cannot unwrap Right value: ${either.value}`);
  }
  return either.value;
}

/**
 * Get the Right value or provide a default if it is a Left.
 */
export const unwrapOrElse = <R>(defaultValue: R) =>
  fold(() => defaultValue, id<R>);

/**
 * Get the Left value or provide a default if it is a Right.
 */
export const unwrapLeftOrElse = <L>(defaultValue: L) =>
  fold(id<L>, () => defaultValue);

/**
 * Perform a side-effect if the Either is a Right.
 */
export const iter = <R>(fn: (value: R) => void) => <L>(either: Either<L, R>): void => {
  if (isRight(either)) fn(either.value);
}

/**
 * Perform a side-effect if the Either is a Left.
 */
export const iterLeft = <L>(fn: (value: L) => void) => <R>(either: Either<L, R>): void => {
  if (isLeft(either)) fn(either.value);
}

/**
 * Alias for iterLeft: perform side-effect if Left.
 */
export const ifLeft = iterLeft;

/**
 * Alias for iter: perform side-effect if Right.
 */
export const ifRight = iter;

/**
 * Swap the Left and Right values.
 */
export const swap = <L, R>(either: Either<L, R>): Either<R, L> =>
  isLeft(either) ? right(either.value) : left(either.value);

const Either = {
  left,
  right,
  isLeft,
  isRight,
  map,
  mapLeft,
  biMap,
  flatMap,
  flatMapLeft,
  fold,
  match,
  unwrap,
  unwrapLeft,
  unwrapOrElse,
  unwrapLeftOrElse,
  iter,
  iterLeft,
  ifLeft,
  ifRight,
  swap,
};

export default Either;