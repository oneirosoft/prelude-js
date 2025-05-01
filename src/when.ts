/**
 * Applies a transformation function only if the predicate returns `true`.
 *
 * This is useful for conditional logic in function pipelines.
 *
 * @template T - The type of the input and output value.
 * @param predicate - A function that returns `true` to apply the transformation.
 * @param fn - A transformation function to apply if the predicate passes.
 * @returns A function that takes a value and conditionally transforms it.
 *
 * @example
 * const doubleIfEven = when(x => x % 2 === 0, x => x * 2);
 * doubleIfEven(4); // 8
 * doubleIfEven(3); // 3
 */
export const when = <T>(predicate: (v: T) => boolean, fn: (v: T) => T) =>
    (value: T): T => predicate(value) ? fn(value) : value;

/**
 * Conditionally performs a side effect based on a predicate.
 *
 * The `effect` function is executed only if the `predicate` returns `true` for the given input.
 * This is useful for executing actions (like logging or tracking) without modifying the original value,
 * especially in functional pipelines.
 *
 * @template T - The type of the input value.
 * @param predicate - A function that determines whether the side effect should be executed.
 * @param effect - A function that performs a side effect when the predicate passes.
 * @returns A function that takes a value of type `T` and conditionally performs the side effect.
 *
 * @example
 * const logIfEven = whenDo(
 *   (n: number) => n % 2 === 0,
 *   (n) => console.log(`${n} is even`)
 * );
 *
 * logIfEven(4); // Logs: "4 is even"
 * logIfEven(3); // Does nothing
 */
export const whenDo = <T>(
    predicate: (v: T) => boolean,
    effect: (v: T) => void
) => (value: T): void => {
    if (predicate(value)) effect(value);
};

/**
 * Applies a transformation function only if the predicate returns `false`.
 *
 * This is the inverse of `when`, useful for applying changes unless a condition is met.
 *
 * @template T - The type of the input and output value.
 * @param predicate - A function that returns `false` to apply the transformation.
 * @param fn - A transformation function to apply if the predicate fails.
 * @returns A function that takes a value and conditionally transforms it.
 *
 * @example
 * const capUnlessAdmin = unless(user => user.isAdmin, user => ({ ...user, role: 'guest' }));
 * capUnlessAdmin({ isAdmin: true });  // { isAdmin: true }
 * capUnlessAdmin({ isAdmin: false }); // { isAdmin: false, role: 'guest' }
 */
export const unless = <T>(predicate: (v: T) => boolean, fn: (v: T) => T) =>
    (value: T): T => predicate(value) ? value : fn(value);