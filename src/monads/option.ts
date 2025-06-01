import { fail } from '../err';
import { id, isNil } from '../fns';
import E from './either';
import type { Either } from './either';

/**
 * Represents a present value.
 */
type Some<T> = {
    readonly type: 'SOME';
    readonly value: NonNullable<T>;
    readonly toJSON: () => {
        readonly type: 'SOME';
        readonly value: NonNullable<T>;
    }
};

/**
 * Represents absence of a value.
 */
type None = {
    readonly type: 'NONE';
    readonly toJSON: () => { readonly type: 'NONE' };
};

/**
 * Represents a value that may or may not be present.
 */
export type Optional<T> = None | Some<T>

/**
 * Shared singleton None value.
 */
export const none: None = {
    type: 'NONE',
    toJSON: () => ({
        type: 'NONE'
    })
};

/**
 * Create a Some Option.
 */
export const some = <T>(value: NonNullable<T>): Optional<T> =>
    isNil(value)
        ? fail('Cannot create Some with null or undefined')
        : {
            type: 'SOME',
            value,
            toJSON: () => ({
                type: 'SOME',
                value,
            })
        }

/**
 * Convert an Option to an Either.
 */
export const toEither = <T>(option: Optional<T>): Either<undefined, T> => {
    switch (option.type) {
        case 'NONE':
            return E.left(undefined);
        case 'SOME':
            return E.right(option.value);
    }
}

/**
 * Create an Option from a nullable value.
 */
export const optional = <T>(value: T | undefined | null): Optional<T> =>
    value === undefined || value === null ? none : some(value);

/**
 * Check if an Option is None.
 */
export const isNone = <T>(option: Optional<T>): option is None =>
    option.type === 'NONE';

/**
 * Check if an Option is Some.
 */
export const isSome = <T>(option: Optional<T>): option is Some<T> =>
    option.type === 'SOME';

/**
 * Flat-map over a Some value, chaining computations.
 */
export const flatMap = <T, U>(fn: (value: NonNullable<T>) => Optional<U>) => (option: Optional<T>): Optional<U> =>
    isSome(option) ? fn(option.value) : none;

/**
 * Map over a Some value.
 */
export const map = <T, U>(fn: (value: T) => U) =>
    flatMap((value: T) => optional(fn(value)));

/**
 * Fold an Option into a value.
 */
export const fold = <T, U>(onSome: (value: T) => U, onNone: () => U) => (option: Optional<T>): U =>
    isNone(option) ? onNone() : onSome((option as Some<T>).value);

/**
 * Extract the Some value, or return a default.
 */
export const getOrElse = <T>(defaultValue: T) => (option: Optional<T>): T =>
    isNone(option) ? defaultValue : option.value

/**
 * Perform a side-effect if Some.
 */
export const iter = <T>(fn: (value: T) => void) => (option: Optional<T>): void => {
    if (isSome(option)) fn(option.value);
};

/**
 * Applies one of two callbacks depending on whether the `Option` contains a value.
 *
 * This is a consumer utility for `Option<T>` that allows branching behavior:
 * - If the option is `some`, the `onSome` function is invoked with the unwrapped value.
 * - If the option is `none`, the `onNone` function is invoked with no arguments.
 *
 * This is useful when you want to perform side-effects (e.g. logging, notifications, etc.)
 * based on the presence or absence of a value, without mapping or transforming it.
 *
 * @template T - Type of the wrapped value (if any).
 * @template U - Unused here but may be reserved for future return type generalization.
 *
 * @param onSome - A function to call if the option is `some`, with the unwrapped value.
 * @param onNone - A function to call if the option is `none`.
 * @returns A function that accepts an `Option<T>` and triggers the appropriate callback.
 *
 * @example
 * const logOption = biIter(
 *   value => console.log('Value is:', value),
 *   () => console.log('No value found')
 * );
 *
 * logOption(some(42)); // logs: "Value is: 42"
 * logOption(none);     // logs: "No value found"
 */
export const biIter = <T, U>(onSome: (value: T) => void, onNone: () => void) => (option: Optional<T>): void =>
    isSome(option) ? onSome(option.value) : onNone();

/**
 * Alias for iter.
 */
export const ifSome = iter

/**
 * Run a side-effect if None.
 */
export const ifNone = <T>(fn: () => void) => (option: Optional<T>): void => {
    if (isNone(option)) fn();
}

/**
 * Pattern match on the Option.
 */
export const match = fold

/**
 * An unsafe operation to unwrap the Option, throwing an error if None.
 */
export const unwrap = <T>(option: Optional<T>, message?: string): T =>
    isNone(option)
        ? fail(message ?? 'Cannot unwrap None')
        : (option as Some<T>).value

/**
 * An unsafe operation to unwrap the Option, returning undefined if None.
 */
export const unsafe = <T>(option: Optional<T>): T | undefined =>
    isNone(option) ? undefined : option.value;

/**
 * Filter the Option based on a predicate.
 */
export const filter = <T>(predicate: (value: NonNullable<T>) => boolean) =>
    flatMap((s: NonNullable<T>) => predicate(s) ? some(s) : none)

/**
 * Filters an array of options and returns an array of unwrapped values.
 * @param options - Array of Option<T>
 */
export const compact = (options: Array<Optional<any>>): Array<any> =>
    options.filter(isSome).map(option => unwrap(option));

/**
 * Run a side-effect if Some.
 */
export const tap = <T>(fn: (value: T) => void) => (option: Optional<T>): Optional<T> => {
    iter(fn)(option);
    return option;
}

/**
 * Flatten a nested Option.
 */
export const flatten = <T>(option: Optional<Optional<T>>): Optional<T> =>
    flatMap(id<Optional<T>>)(option);

/**
 * The Option module.
 */
const Option = {
    some,
    none,
    optional,
    isNone,
    isSome,
    map,
    flatMap,
    fold,
    getOrElse,
    iter,
    biIter,
    filter,
    ifSome,
    ifNone,
    match,
    unwrap,
    unsafe,
    compact,
    tap,
    flatten,
}

export default Option
