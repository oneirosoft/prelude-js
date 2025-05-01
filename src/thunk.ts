/**
 * A Thunk represents a deferred computation — a function that takes no arguments and returns a value of type T.
 */
export type Thunk<T> = () => T;

/**
 * Evaluate (force) the thunk.
 * 
 * @param thunk - A function returning T
 * @returns The result of calling the thunk
 */
export const force = <T>(thunk: Thunk<T>): T => thunk();

/**
 * Transform the result of a thunk using a mapping function.
 * 
 * @param fn - Function to transform T to U
 * @returns A new thunk returning U
 */
export const map = <T, U>(fn: (value: T) => U) => (thunk: Thunk<T>): Thunk<U> =>
    () => fn(thunk());

export const iter = <T>(fn: (value: T) => void) => (thunk: Thunk<T>): void =>
    fn(thunk());

/**
 * The Thunk module, for functional composition.
 */
const Thunk = {
    force,
    map,
    iter,
};

export default Thunk;