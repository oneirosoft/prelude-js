/**
 * Executes a function and catches any errors that occur, returning a fallback value.
 *
 * Useful for safely executing code that might throw without crashing the application.
 * If the `fn` throws, the `onError` handler is invoked with the thrown error.
 *
 * @template T - The return type of the function and fallback.
 * @param fn - A function that might throw.
 * @param onError - A fallback handler to call if `fn` throws. Receives the error as an argument.
 * @returns The result of `fn()` if no error is thrown, otherwise the result of `onError(e)`.
 *
 * @example
 * const safeParse = (json: string) =>
 *   tryCatch(() => JSON.parse(json), () => ({}));
 *
 * safeParse('{ "x": 1 }'); // { x: 1 }
 * safeParse('bad');        // {}
 */
export const tryCatch = <T>(fn: () => T, onError: (e: unknown) => T): T => {
    try { return fn(); }
    catch (e) { return onError(e); }
};

/**
 * Wraps an async function call with try/catch and fallback logic.
 *
 * @param fn - An async function that may throw.
 * @param onError - A handler function to recover from the error.
 * @returns A Promise that resolves to the result or the fallback.
 *
 * @example
 * const safeFetch = () => tryCatchAsync(() => fetch(url), () => new Response("fallback"));
 */
export const tryCatchAsync = async <T>(
    fn: () => Promise<T>,
    onError: (e: unknown) => T | Promise<T>
): Promise<T> => {
    try {
        return await fn();
    } catch (e) {
        return await onError(e);
    }
};