/**
 * Lazy, memoized, immutable sequence abstraction.
 * Shares internal evaluation cache between all derived sequences.
 */
import { some, none, type Option, optional, isNone, unwrap, fold, flatMap } from './monads/option';
import { attempt, type Result } from './monads/safe';

/**
 * A lazy, immutable sequence of values supporting functional operations.
 */
/**
 * A lazy, immutable sequence of values supporting functional operations.
 * 
 * Each transformation creates a new sequence and preserves immutability.
 * Values are memoized as they are evaluated, enabling efficient reuse.
 */
export type Seq<T> = Iterable<T> & {
    /**
     * Retrieves the element at the specified index, lazily evaluating elements as needed.
     * 
     * If the index is out of bounds, returns `Option.none`.
     * 
     * @param index - The zero-based index of the element to retrieve.
     * @returns An `Option<T>` representing the element at the index.
     */
    get(index: number): Option<T>;

    /**
     * Retrieves the first element of the sequence.
     * 
     * Equivalent to `get(0)`.
     * 
     * @returns An `Option<T>` representing the first value, or `none` if empty.
     */
    head(): Option<T>;

    /**
     * Returns a new sequence representing all elements after the first.
     * 
     * This is equivalent to `drop(1)`, and is evaluated lazily.
     * 
     * @returns A new `Seq<T>` without the head element.
     */
    tail(): Seq<T>;

    /**
     * Returns an iterable that can enumerate all values in the sequence.
     * 
     * Unlike the raw iterator, this method uses `get(index)` to preserve memoization.
     * 
     * @returns An `IterableIterator<T>` of sequence values.
     */
    values(): IterableIterator<T>;

    /**
     * Lazily applies a function to each element and flattens the resulting sequences.
     * 
     * This is a monadic bind operation, similar to `Array.prototype.flatMap`.
     * 
     * @param fn - A function that maps each value to a `Seq<U>`.
     * @returns A new flattened `Seq<U>` of mapped elements.
     */
    flatMap<U>(fn: (value: T) => Seq<U>): Seq<U>;

    /**
     * Combines two sequences element-wise into pairs.
     * 
     * Evaluation stops at the shorter of the two sequences.
     * 
     * @param other - The sequence to zip with.
     * @returns A `Seq<[T, U]>` pairing each element.
     */
    zip<U>(other: Seq<U>): Seq<[T, U]>;

    /**
     * Lazily applies a transformation function to each element.
     * 
     * @param fn - Function to transform each value.
     * @returns A new `Seq<U>` of transformed values.
     */
    map<U>(fn: (value: T, i: number) => U): Seq<U>;

    /**
     * Lazily filters the sequence, only including values that match a predicate.
     * 
     * @param fn - Predicate function to test each element.
     * @returns A new `Seq<T>` with matching values.
     */
    filter(fn: (value: T) => boolean): Seq<T>;

    /**
     * Eagerly reduces the sequence to a single value.
     * 
     * @param fn - Function that combines an accumulator and value.
     * @param initial - Initial value for the accumulator.
     * @returns The final accumulated result.
     */
    reduce<U>(fn: (acc: U, value: T) => U, initial: U): U;

    /**
     * Lazily takes the first `n` elements from the sequence.
     * 
     * @param n - Number of elements to take.
     * @returns A `Seq<T>` containing at most `n` elements.
     */
    take(n: number): Seq<T>;

    /**
     * Lazily skips the first `n` elements of the sequence.
     * 
     * @param n - Number of elements to drop.
     * @returns A `Seq<T>` without the first `n` values.
     */
    drop(n: number): Seq<T>;

    /**
     * Applies a side effect for each value in the sequence.
     * 
     * This method fully evaluates the sequence.
     * 
     * @param fn - Side-effecting function to call on each value.
     */
    forEach(fn: (value: T) => void): void;

    /**
     * Finds the first element matching a predicate.
     * 
     * @param fn - Predicate function to test values.
     * @returns An `Option<T>` containing the first match, or `none`.
     */
    find(fn: (value: T) => boolean): Option<T>;

    /**
     * Returns `true` if at least one element satisfies the predicate.
     * 
     * @param fn - Predicate to test values.
     * @returns `true` if a match is found; otherwise `false`.
     */
    some(fn: (value: T) => boolean): boolean;

    /**
     * Returns `true` only if all elements satisfy the predicate.
     * 
     * @param fn - Predicate to test values.
     * @returns `true` if all match, otherwise `false`.
     */
    every(fn: (value: T) => boolean): boolean;

    /**
     * Returns `true` if the sequence has no values.
     * 
     * Equivalent to checking if `head()` is `none`.
     * 
     * @returns `true` if the sequence is empty.
     */
    isEmpty(): boolean;

    /**
     * Counts the number of elements in the sequence with an optional safety limit.
     * 
     * If the count exceeds the max, a `Failure` is returned.
     * 
     * @param max - Maximum elements to evaluate (default: 10,000).
     * @returns A `Safe<number>` containing the count or failure.
     */
    length(max?: number): Result<number>;

    /**
     * Unsafely counts the number of elements by fully evaluating the sequence.
     * 
     * ⚠️ Use with caution. May hang or crash if the sequence is infinite.
     * 
     * @returns The total number of elements.
     */
    lengthUnsafe(): number;

    /**
     * Appends a single value to the end of the sequence.
     * 
     * @param value - The value to append.
     * @returns A new sequence with the value added at the end.
     */
    append(value: T): Seq<T>;

    /**
     * Prepends a single value to the beginning of the sequence.
     * 
     * @param value - The value to prepend.
     * @returns A new sequence with the value inserted at the start.
     */
    prepend(value: T): Seq<T>;

    /**
     * Groups elements of the sequence into a map by a key.
     * 
     * @param fn - Function to generate a grouping key from each element.
     * @returns A `Map<K, Seq<T>>` of grouped sequences.
     */
    groupBy<K>(fn: (value: T) => K): Map<K, Seq<T>>;

    /**
     * Partitions the sequence into two based on a predicate.
     * 
     * @param fn - Predicate function.
     * @returns A tuple of `[matching, nonMatching]` sequences.
     */
    partition(fn: (value: T) => boolean): [Seq<T>, Seq<T>];

    /**
     * Returns a sequence with duplicate elements removed.
     * 
     * Equality is determined by `Set` identity.
     * 
     * @returns A new `Seq<T>` with only distinct values.
     */
    distinct(): Seq<T>;

    /**
     * Returns a new sequence of accumulated values from a reducer.
     * 
     * Useful for generating running totals or stateful transformations.
     * 
     * @param fn - Reducer function `(acc, value) => newAcc`.
     * @param initial - Initial accumulator value.
     * @returns A `Seq<U>` of all intermediate accumulator values.
     */
    scan<U>(fn: (acc: U, value: T) => U, initial: U): Seq<U>;

    /**
     * Retrieves the final element of the sequence.
     * 
     * This eagerly walks through all values.
     * 
     * @returns An `Option<T>` containing the last element, or `none`.
     */
    last(): Option<T>;

    /**
     * Reverses the sequence into a new sequence.
     * 
     * To ensure safety, you must provide a `max` number of elements to evaluate.
     * 
     * If the sequence exceeds `max`, a `Failure` is returned.
     * 
     * @param max - Maximum number of values to evaluate.
     * @returns A `Safe<Seq<T>>` of reversed elements or a `Failure`.
     */
    reverse(max?: number): Result<Seq<T>>;

    /**
     * Reverses the sequence into a new sequence.
     * 
     * ⚠️ This method is unsafe — it will evaluate all elements in memory.
     * Use only when the sequence is known to be small and bounded.
     * 
     * @returns A new reversed sequence.
     */
    reverseUnsafe(): Seq<T>;

    /**
     * Lazily slices the sequence from `start` (inclusive) to `end` (exclusive).
     * 
     * If `end` is omitted, the slice continues to the end of the sequence.
     * 
     * @param start - Index to begin at (inclusive).
     * @param end - Index to end at (exclusive). Optional.
     * @returns A new `Seq<T>` with sliced elements.
     */
    slice(start: number, end?: number): Seq<T>;
    /**
     * Splits the sequence into consecutive chunks of the specified size.
     *
     * Each chunk is a `Seq<T>` containing up to `size` elements.
     * The last chunk may be smaller if there are not enough remaining elements.
     * 
     * Evaluation is lazy. Each chunk is materialized on-demand.
     * 
     * @param size - The size of each chunk (must be > 0).
     * @returns A sequence of sequences, where each subsequence is a chunk of size `size`.
     *
     * @throws Error if `size <= 0`
     *
     * @example
     * const seq = Seq.fromArray([1, 2, 3, 4, 5]);
     * const chunks = seq.chunk(2); // [[1, 2], [3, 4], [5]]
     */
    chunk(size: number): Seq<Seq<T>>;
    /**
     * Splits the sequence into chunks where each chunk contains contiguous elements
     * that map to the same key using the provided function.
     * 
     * Unlike `groupBy`, this preserves input order and only groups adjacent values with the same key.
     *
     * @template K - The type returned by the key-mapping function.
     * @param fn - A function that maps each element to a key.
     * @returns A sequence of sequences grouped by contiguous keys.
     *
     * @example
     * const seq = Seq.fromArray([1, 1, 2, 2, 3, 1]);
     * const grouped = seq.chunkBy(x => x); // [[1, 1], [2, 2], [3], [1]]
     */
    chunkBy<K>(fn: (value: T) => K): Seq<Seq<T>>;
    /**
     * Produces a sliding window over the sequence.
     * 
     * Each window is a subsequence of the previous one, offset by one element,
     * containing up to `size` elements.
     * 
     * The result is a sequence of `Seq<T>` windows. The first window starts at index 0,
     * and the last window will end at the final item in the sequence.
     *
     * This is useful for time-series or running computations.
     * 
     * @param size - Size of each sliding window (must be > 0).
     * @returns A sequence of overlapping windows.
     *
     * @example
     * const seq = Seq.fromArray([1, 2, 3, 4]);
     * const win = seq.window(2); // [[1, 2], [2, 3], [3, 4]]
     */
    window(size: number): Seq<Seq<T>>;

    /**
     * Returns `true` if no elements satisfy the predicate.
     * 
     * This is the logical opposite of `.some(fn)`.
     *
     * @param fn - Predicate to test values.
     * @returns `true` if no elements match, `false` otherwise.
     *
     * @example
     * const empty = seq.none(x => x > 100);
     */
    none(fn: (value: T) => boolean): boolean;

    /**
     * Counts the number of elements matching a predicate.
     * If no predicate is given, counts all elements.
     * 
     * Fully evaluates the sequence.
     *
     * @param fn - Optional predicate function.
     * @returns The number of elements (matching if `fn` provided).
     *
     * @example
     * const total = seq.count();
     * const even = seq.count(x => x % 2 === 0);
     */
    count(fn?: (value: T) => boolean): number;

    /**
     * Checks if this sequence starts with the given prefix sequence.
     * 
     * Short-circuits as soon as a mismatch is found or prefix ends.
     * 
     * @param prefix - Sequence to compare from the start.
     * @returns `true` if the sequence starts with the same elements as `prefix`.
     *
     * @example
     * const s1 = Seq.fromArray([1, 2, 3]);
     * s1.startsWith(Seq.fromArray([1, 2])); // true
     */
    startsWith(prefix: Seq<T>): boolean;

    /**
     * Checks if this sequence ends with the given suffix sequence.
     * 
     * Fully evaluates both sequences.
     * 
     * @param suffix - Sequence to compare at the end.
     * @returns `true` if the sequence ends with the same elements as `suffix`.
     *
     * @example
     * const s1 = Seq.fromArray([1, 2, 3]);
     * s1.endsWith(Seq.fromArray([2, 3])); // true
     */
    endsWith(suffix: Seq<T>): boolean;

    /**
     * Inserts a value at a given index without modifying the original sequence.
     * 
     * All subsequent elements are shifted to the right.
     *
     * @param index - The index at which to insert.
     * @param value - The value to insert.
     * @returns A new sequence with the inserted value.
     *
     * @example
     * const seq = Seq.fromArray([1, 3]);
     * const modified = seq.insertAt(1, 2); // [1, 2, 3]
     */
    insertAt(index: number, value: T): Seq<T>;

    /**
     * Removes the element at the specified index.
     *
     * All subsequent elements are shifted left.
     * If the index is out of bounds, the sequence is returned unchanged.
     *
     * @param index - The index of the element to remove.
     * @returns A new sequence without the element at `index`.
     *
     * @example
     * const seq = Seq.fromArray([1, 2, 3]);
     * const modified = seq.removeAt(1); // [1, 3]
     */
    removeAt(index: number): Seq<T>;

    /**
     * Replaces the element at the specified index with a new value.
     * 
     * If the index is out of bounds, the sequence is returned unchanged.
     *
     * @param index - The index of the element to replace.
     * @param value - The new value to place at the index.
     * @returns A new sequence with the updated value.
     *
     * @example
     * const seq = Seq.fromArray([1, 2, 3]);
     * const modified = seq.replaceAt(1, 99); // [1, 99, 3]
     */
    replaceAt(index: number, value: T): Seq<T>;

    /**
     * Flattens one level of nesting.
     *
     * @returns A `Seq<T>` emitting all values from each inner sequence in order.
     */
    flatten(): Seq<T>;

    /**
 * Emits overlapping pairs [prev, curr] for each adjacent elements.
 * The first element is paired with the second, etc.
 * @returns A Seq<[T, T]> of length (n-1) for an n-element sequence.
 */
    pairwise(): Seq<[T, T]>;

    /**
     * Removes duplicates by a key function.
     * Only the first occurrence of each key is kept.
     * @param fn – Key extractor for each element.
     * @returns A lazy Seq<T> with distinct keys.
     */
    distinctBy<K>(fn: (value: T) => K): Seq<T>;

    /**
     * Returns a new sequence whose elements are randomly shuffled.
     * This method is eager: it fully materializes the source, shuffles,
     * then re-exposes a Seq over that buffer.
     *
     * @returns A Seq<T> in random order.
     */
    shuffle(): Seq<T>;

    /**
     * Inserts `separator` between every two elements.
     * @param separator – The value to intersperse.
     * @returns A Seq<T> of length (2n-1) for an n-element input.
     */
    intersperse(separator: T): Seq<T>;

    /**
     * Splits the sequence *whenever* the predicate is `true`, emitting
     * each slice as a Seq<T>. Boundaries are *not* included in the output.
     *
     * @param fn – A predicate; whenever `fn(value)` is true, start a new slice.
     * @returns A Seq<Seq<T>> of contiguous runs.
     */
    sliceBy(fn: (value: T) => boolean): Seq<Seq<T>>;
};

/**
 * Create a new lazy sequence from a source iterator.
 * Caches values as they are accessed.
 */
export const create = <T>(source: () => Iterator<T>): Seq<T> => {
    const cache: T[] = [];

    const iterable: Seq<T> = {
        get(idx: number): Option<T> {
            if (idx < cache.length) return optional(cache[idx]);
            const it = source();
            for (let i = 0; i < cache.length; i++) it.next();
            while (cache.length <= idx) {
                const n = it.next();
                if (n.done) return none;
                cache.push(n.value);
            }
            return optional(cache[idx]);
        },

        [Symbol.iterator](): Iterator<T> & { [Symbol.iterator](): any } {
            let i = 0;
            return {
                next(): IteratorResult<T> {
                    const o = iterable.get(i++);
                    return fold(
                        (v: T) => ({ done: false, value: v }),
                        () => ({ done: true, value: undefined as any })
                    )(o);
                },
                [Symbol.iterator]() { return this; }
            };
        },

        head() { return iterable.get(0) },
        tail() { return iterable.drop(1) },

        values() {
            let i = 0;
            return {
                [Symbol.iterator]() { return this; },
                next: (): IteratorResult<T> => {
                    const o = iterable.get(i++);
                    return fold(
                        (v: T) => ({ done: false, value: v }),
                        () => ({ done: true, value: undefined as any })
                    )(o);
                }
            };
        },

        flatMap<U>(fn: (v: T) => Seq<U>): Seq<U> {
            return create(() => {
                // **Fresh** outer iterator for every `get` or `[Symbol.iterator]`
                const outer = iterable[Symbol.iterator]();
                let inner: Iterator<U> | null = null;

                return {
                    next(): IteratorResult<U> {
                        while (true) {
                            if (inner) {
                                const n = inner.next();
                                if (!n.done) return { done: false, value: n.value };
                                inner = null;
                            }
                            const o = outer.next();
                            if (o.done) return { done: true, value: undefined as any };
                            inner = fn(o.value)[Symbol.iterator]();
                        }
                    }
                };
            });
        },

        zip<U>(other: Seq<U>): Seq<[T, U]> {
            return create(() => {
                // **Fresh** pair of iterators each time
                const la = iterable[Symbol.iterator]();
                const lb = other[Symbol.iterator]();

                return {
                    next(): IteratorResult<[T, U]> {
                        const a = la.next();
                        const b = lb.next();
                        return (a.done || b.done)
                            ? { done: true, value: undefined as any }
                            : { done: false, value: [a.value, b.value] };
                    }
                };
            });
        },

        map<U>(fn: (v: T, i: number) => U): Seq<U> {
            return create(() => {
                const it = iterable[Symbol.iterator]();
                let i = 0;
                return {
                    [Symbol.iterator]() { return this; },
                    next(): IteratorResult<U> {
                        const n = it.next();
                        return n.done
                            ? { done: true, value: undefined as any }
                            : { done: false, value: fn(n.value, i++) };
                    }
                };
            });
        },

        filter(fn: (v: T) => boolean): Seq<T> {
            return create(() => {
                const it = iterable[Symbol.iterator]();
                return {
                    [Symbol.iterator]() { return this; },
                    next(): IteratorResult<T> {
                        while (true) {
                            const n = it.next();
                            if (n.done) return { done: true, value: undefined as any };
                            if (fn(n.value)) return { done: false, value: n.value };
                        }
                    }
                };
            });
        },

        take(n: number): Seq<T> {
            const m = Math.max(0, n);
            return create(() => {
                let i = 0;
                return {
                    [Symbol.iterator]() { return this; },
                    next(): IteratorResult<T> {
                        if (i >= m) return { done: true, value: undefined as any };
                        const o = iterable.get(i++);
                        return fold(
                            (v: T) => ({ done: false, value: v }),
                            () => ({ done: true, value: undefined as any })
                        )(o);
                    }
                };
            });
        },

        drop(n: number): Seq<T> {
            return create(() => {
                let i = n;
                return {
                    [Symbol.iterator]() { return this; },
                    next(): IteratorResult<T> {
                        const o = iterable.get(i++);
                        return fold(
                            (v: T) => ({ done: false, value: v }),
                            () => ({ done: true, value: undefined as any })
                        )(o);
                    }
                };
            });
        },

        reduce<U>(fn: (acc: U, v: T) => U, init: U): U {
            let acc = init;
            for (const v of this) acc = fn(acc, v);
            return acc;
        },

        forEach(fn) { for (const v of this) fn(v) },
        find(fn) { for (const v of this) if (fn(v)) return some(v); return none },
        some(fn) { for (const v of this) if (fn(v)) return true; return false },
        every(fn) { for (const v of this) if (!fn(v)) return false; return true },
        isEmpty() { return isNone(iterable.get(0)) },

        length(max = 10_000) {
            return attempt(() => {
                let c = 0;
                for (const _ of this) {
                    if (++c > max) throw new Error("Too large");
                }
                return c;
            });
        },
        lengthUnsafe() { let c = 0; for (const _ of this) c++; return c },

        append(v: T): Seq<T> {
            return create(() => {
                // 1) **declare your iterator and flags inside** this factory
                const it = iterable[Symbol.iterator]();
                let pushed = false;

                // 2) return an Iterator<T> that closes over *these* locals
                return {
                    [Symbol.iterator]() { return this },
                    next(): IteratorResult<T> {
                        const n = it.next();
                        if (!n.done) return n;
                        if (!pushed) {
                            pushed = true;
                            return { done: false, value: v };
                        }
                        return { done: true, value: undefined as any };
                    }
                };
            });
        },

        prepend(v: T): Seq<T> {
            return create(() => {
                const it = iterable[Symbol.iterator]();
                let atFront = true;

                return {
                    [Symbol.iterator]() { return this },
                    next(): IteratorResult<T> {
                        if (atFront) {
                            atFront = false;
                            return { done: false, value: v };
                        }
                        return it.next();
                    }
                };
            });
        },

        distinct(): Seq<T> {
            return create(() => {
                const it = iterable[Symbol.iterator]();
                const seen = new Set<T>();

                return {
                    [Symbol.iterator]() { return this },
                    next(): IteratorResult<T> {
                        while (true) {
                            const n = it.next();
                            if (n.done) return { done: true, value: undefined as any };
                            if (!seen.has(n.value)) {
                                seen.add(n.value);
                                return { done: false, value: n.value };
                            }
                        }
                    }
                };
            });
        },

        scan<U>(fn: (acc: U, v: T) => U, initial: U): Seq<U> {
            return create(() => {
                const it = iterable[Symbol.iterator]();
                let acc = initial;

                return {
                    [Symbol.iterator]() { return this },
                    next(): IteratorResult<U> {
                        const n = it.next();
                        if (n.done) return { done: true, value: undefined as any };
                        acc = fn(acc, n.value);
                        return { done: false, value: acc };
                    }
                };
            });
        },

        slice(start: number, end: number = Infinity): Seq<T> {
            const dropped = this.drop(start);
            const s = Math.max(0, start);
            const e = end <= s ? s : end;
            return isFinite(e)
                ? dropped.take(e - s)
                : dropped;
        },

        groupBy<K>(fn: (value: T) => K): Map<K, Seq<T>> {
            const groups = new Map<K, T[]>();
            for (const value of iterable) {
                const key = fn(value);
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(value);
            }
            const result = new Map<K, Seq<T>>();
            for (const [k, v] of groups) {
                result.set(k, fromArray(v));
            }
            return result;
        },

        partition(predicate) {
            const pass: T[] = [], fail: T[] = [];
            for (const value of iterable) {
                (predicate(value) ? pass : fail).push(value);
            }
            return [fromArray(pass), fromArray(fail)];
        },

        last() {
            let last: Option<T> = none;
            for (const value of iterable) {
                last = some(value);
            }
            return last;
        },

        reverse(max = 10_000) {
            return attempt(() => {
                const arr = [];
                let count = 0;
                for (const val of iterable) {
                    arr.push(val);
                    count++;
                    if (count > max)
                        throw new Error('Cannot reverse an unbounded or very large sequence');
                }
                return fromArray(arr.reverse());
            });
        },

        reverseUnsafe() {
            const arr = [];
            for (const val of iterable) {
                arr.push(val);
            }
            return fromArray(arr.reverse());
        },

        chunk(size: number): Seq<Seq<T>> {
            if (size <= 0)
                throw new Error('Chunk size must be greater than 0');

            return create(() => {
                const it = iterable[Symbol.iterator]();
                let chunk: T[] = [];

                return {
                    next(): IteratorResult<Seq<T>> {
                        while (chunk.length < size) {
                            const next = it.next();
                            if (next.done) {
                                if (chunk.length === 0)
                                    return { done: true, value: undefined as any };
                                break;
                            }
                            chunk.push(next.value);
                        }
                        const result = fromArray(chunk);
                        chunk = [];
                        return { done: false, value: result };
                    }
                };
            });
        },

        chunkBy<K>(fn: (value: T) => K): Seq<Seq<T>> {
            return create(() => {
                const it = iterable[Symbol.iterator]();
                let currentChunk: T[] = [];
                let prevKey: K | undefined;
                let done = false;

                return {
                    next(): IteratorResult<Seq<T>> {
                        if (done) return { done: true, value: undefined as any };

                        while (true) {
                            const next = it.next();
                            if (next.done) {
                                done = true;
                                if (currentChunk.length > 0) {
                                    const chunk = fromArray(currentChunk);
                                    currentChunk = [];
                                    return { done: false, value: chunk };
                                }
                                return { done: true, value: undefined as any };
                            }

                            const key = fn(next.value);
                            if (currentChunk.length === 0 || key === prevKey) {
                                currentChunk.push(next.value);
                                prevKey = key;
                            } else {
                                const chunk = fromArray(currentChunk);
                                currentChunk = [next.value];
                                prevKey = key;
                                return { done: false, value: chunk };
                            }
                        }
                    }
                };
            });
        },

        window(size: number): Seq<Seq<T>> {
            if (size <= 0) throw new Error("Window size must be greater than 0");

            return create(() => {
                const it = iterable[Symbol.iterator]();
                const buffer: T[] = [];

                return {
                    next(): IteratorResult<Seq<T>> {
                        while (buffer.length < size) {
                            const next = it.next();
                            if (next.done) return { done: true, value: undefined as any };
                            buffer.push(next.value);
                        }

                        const window = fromArray([...buffer]);
                        buffer.shift(); // Slide the window
                        return { done: false, value: window };
                    }
                };
            });
        },

        none(fn: (value: T) => boolean): boolean {
            for (const value of iterable) if (fn(value)) return false;
            return true;
        },

        count(fn?: (value: T) => boolean): number {
            let count = 0;
            for (const value of iterable) {
                if (!fn || fn(value)) count++;
            }
            return count;
        },

        startsWith(prefix: Seq<T>): boolean {
            const it1 = iterable[Symbol.iterator]();
            const it2 = prefix[Symbol.iterator]();
            while (true) {
                const a = it1.next();
                const b = it2.next();
                if (b.done) return true;
                if (a.done || a.value !== b.value) return false;
            }
        },

        endsWith(suffix: Seq<T>): boolean {
            const full = [...iterable];
            const end = [...suffix];
            if (end.length > full.length) return false;
            const offset = full.length - end.length;
            return end.every((val, i) => val === full[offset + i]);
        },

        insertAt(index: number, value: T): Seq<T> {
            return create(() => {
                const it = iterable[Symbol.iterator]();
                let i = 0;
                let inserted = false;
                return {
                    next(): IteratorResult<T> {
                        if (i === index && !inserted) {
                            inserted = true;
                            return { value, done: false };
                        }
                        const next = it.next();
                        if (next.done) return { done: true, value: undefined as any };
                        i++;
                        return { done: false, value: next.value };
                    }
                };
            });
        },

        removeAt(index: number): Seq<T> {
            return create(() => {
                const it = iterable[Symbol.iterator]();
                let i = 0;
                return {
                    next(): IteratorResult<T> {
                        while (true) {
                            const next = it.next();
                            if (next.done) return { done: true, value: undefined as any };
                            if (i++ === index) continue;
                            return { done: false, value: next.value };
                        }
                    }
                };
            });
        },

        replaceAt(index: number, newValue: T): Seq<T> {
            return create(() => {
                const it = iterable[Symbol.iterator]();
                let i = 0;
                return {
                    next(): IteratorResult<T> {
                        const next = it.next();
                        if (next.done) return { done: true, value: undefined as any };
                        const val = i++ === index ? newValue : next.value;
                        return { done: false, value: val };
                    }
                };
            });
        },

        flatten<U>(this: Seq<Seq<U>>): Seq<U> {
            return flatten(this);
        },

        pairwise(): Seq<[T, T]> {
            return pairwise(this)
        },

        distinctBy(fn) {
            return distinctBy(fn)(this);
        },

        shuffle() {
            return shuffle(this);
        },

        intersperse(separator: T): Seq<T> {
            return intersperse(separator)(this)
        },

        sliceBy(fn) {
            return sliceBy(fn)(this);
        },
    };

    return iterable;
};


/** Create a lazy sequence from an array */
export const fromArray = <T>(arr: T[]): Seq<T> => {
    const cloned = arr.slice(); // shallow copy
    return create(() => {
        let index = 0;
        return {
            next(): IteratorResult<T> {
                if (index < cloned.length)
                    return { done: false, value: cloned[index++] as T };
                return { done: true, value: undefined as any };
            }
        };
    });
};

/**
 * Converts a sequence into a fully evaluated array.
 * 
 * This method eagerly consumes the sequence, storing all elements into a new array.
 * It includes a safety limit (`max`) to protect against converting infinite or excessively large sequences.
 * 
 * If the number of elements exceeds `max`, this method returns a `Failure`.
 * 
 * @param seq - The sequence to convert.
 * @param max - Optional maximum number of elements to evaluate (default: 10,000).
 * @returns A `Safe<T[]>`: 
 *   - `Success<T[]>` if the conversion completes within the limit
 *   - `Failure` if the limit is exceeded
 * 
 * @example
 * const safeArray = Seq.toArray(seq); // default max = 10,000
 * 
 * Safe.match(
 *   err => console.error('Too long to convert:', err),
 *   arr => console.log(arr)
 * )(safeArray);
 */
export const toArray = <T>(seq: Seq<T>, max?: number): Result<T[]> =>
    attempt(() => {
        const arr: T[] = [];
        let count = 0;
        for (const value of seq) {
            arr.push(value);
            count++;
            if (count > (max ?? 10_000)) throw new Error('Cannot convert an unbounded or very large sequence');
        }
        return arr;
    });

/**
 * Converts a sequence into an array without any safety limit.
 * 
 * This method eagerly consumes the entire sequence into a new array.
 * If the sequence is infinite or extremely large, this can cause memory exhaustion or an infinite loop.
 * 
 * Use `toArray()` instead if safety or predictability is needed.
 * 
 * @param seq - The sequence to convert.
 * @returns An array containing all elements from the sequence.
 * 
 * @example
 * const arr = Seq.toArrayUnsafe(seq); // may hang or crash on infinite sequences
 */
export const toArrayUnsafe = <T>(seq: Seq<T>): T[] =>
    [...seq]

/**
 * Builds a lazy, potentially infinite `Seq<T>` by successively applying a function to a state.
 *
 * This is a functional corecursive generator, similar to `Array.from` with a generator, but lazy.
 *
 * The function `fn` receives the current state and returns an `Option<[T, U]>`, where:
 * - `T` is the next value to yield
 * - `U` is the next state to be used for the next step
 * - `none` signals termination of the sequence
 *
 * @template T - The type of elements in the resulting sequence.
 * @template U - The type of the internal state used for generation.
 * @param fn - A function that receives a state `U` and returns an `Option<[T, U]>`.
 * @returns A lazy `Seq<T>` of generated values.
 *
 * @example
 * // Generate an infinite sequence of natural numbers
 * const naturals = unfold(n => some([n, n + 1]))(0);
 *
 * // Generate a countdown from 5 to 1
 * const countdown = unfold(n => n > 0 ? some([n, n - 1]) : none)(5);
 */
export const unfold = <T, U>(fn: (state: U) => Option<[T, U]>) => (seed: U): Seq<T> => {
    return create(() => {
        let state: Option<[T, U]> = fn(seed);
        return {
            next(): IteratorResult<T> {
                if (isNone(state)) return { done: true, value: undefined as any };
                const [value, newState] = unwrap(state);
                state = fn(newState);
                return { done: false, value };
            }
        };
    });
}

/**
 * Creates a lazy finite sequence of numbers from `start` (inclusive) to `end` (exclusive).
 *
 * The resulting sequence is lazily evaluated and memoized, avoiding unnecessary computation.
 *
 * @param start - The starting number (inclusive).
 * @param end - The ending number (exclusive). Must be greater than or equal to `start`.
 * @returns A `Seq<number>` of ascending integers from `start` to `end - 1`.
 *
 * @example
 * const seq = Seq.range(0, 5);
 * console.log([...seq]); // [0, 1, 2, 3, 4]
 */
export const range = (start: number, end: number): Seq<number> =>
    unfold((state: number) => {
        if (state >= end) return none;
        return some([state, state + 1]);
    })(start);


/**
 * Generates an infinite lazy sequence of Fibonacci numbers.
 *
 * Each element is computed lazily and memoized as it is accessed.
 * The sequence starts with 0 and 1, and continues indefinitely with the sum of the two previous values.
 *
 * @returns A `Seq<number>` representing the Fibonacci sequence.
 *
 * @example
 * const firstTen = Seq.fib.take(10);
 * console.log([...firstTen]); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
 */
export const fib = unfold(
    ([a, b]: [number, number]) => 
        some<[number, [number, number]]>([a, [b, a + b]])
)([0, 1]);

/**
 * Adds an index to each element in the sequence, starting at 0.
 *
 * This is useful for enumeration or mapping with awareness of position.
 * Lazily pairs each element in the sequence with its index.
 *
 * @param seq - The sequence to enumerate.
 * @returns A `Seq<[number, T]>` where each item is a tuple of [index, value].
 *
 * @example
 * const seq = Seq.fromArray(['a', 'b', 'c']);
 * const result = Seq.enumerate(seq);
 * console.log([...result]); // [[0, 'a'], [1, 'b'], [2, 'c']]
 */
export const enumerate = <T>(seq: Seq<T>): Seq<[number, T]> =>
    range(0, Infinity).zip(seq);

/**
 * Creates a lazy finite sequence by repeating a given value a fixed number of times.
 *
 * This is useful for padding, initialization, or building test sequences.
 * Lazily constructs the repeated sequence and memoizes it during traversal.
 *
 * @param value - The value to repeat.
 * @param times - Number of times to repeat the value.
 * @returns A `Seq<T>` of repeated values.
 *
 * @example
 * const repeated = Seq.repeat('x', 3);
 * console.log([...repeated]); // ['x', 'x', 'x']
 */
export const repeat = <T>(value: T, times: number): Seq<T> =>
    Seq.range(0, times).map(() => value);
/**
 * Creates a lazy infinite sequence by cycling through the values in the given array.
 *
 * Once the end of the array is reached, iteration restarts from the beginning.
 * The resulting sequence is infinite and will continue indefinitely.
 *
 * @param values - An array of values to cycle through.
 * @returns A lazy infinite `Seq<T>` that loops through the array repeatedly.
 *
 * @example
 * const cyclic = Seq.cycle(['A', 'B']);
 * console.log([...cyclic.take(5)]); // ['A', 'B', 'A', 'B', 'A']
 *
 * @note This will return `none` and stop if the array is empty.
 */
export const cycle = <T>(values: T[]): Seq<T> =>
    unfold((state: number) => {
        if (values.length === 0) return none;
        return flatMap<T, [T, number]>((v) => some([v, (state + 1) % values.length]))
            (optional<T>(values[state]));
    })(0);

/**
 * Repeats the entire input array `n` times, returning a finite sequence.
 *
 * This differs from `take(n)` on an infinite cycle—this returns `input.length * n` elements.
 *
 * @param values - The values to repeat.
 * @param n - Number of full times to cycle the entire array.
 * @returns A `Seq<T>` with the array repeated `n` times.
 *
 * @example
 * cycleN(['x', 'y'], 2); // ['x', 'y', 'x', 'y']
 */
export const cycleN = <T>(values: T[], n: number): Seq<T> =>
    range(0, values.length * n)
        .map(i => values[i % values.length] as T);

/**
 * Flattens a sequence of sequences into a single sequence of values.
 *
 * This is the “join” operation for `Seq<Seq<T>>`, equivalent to
 * calling `.flatMap(x => x)` but specialized for a sequence of sequences.
 *
 * Elements are emitted in the same order as their sub-sequences,
 * and nothing is evaluated until you iterate.
 *
 * @template T
 * @param seqOfSeq - A sequence whose elements are themselves sequences.
 * @returns A new `Seq<T>` that yields all the values from each inner sequence, in order.
 * 
 * @example
 * const nested = Seq.fromArray([
 *   Seq.fromArray([1, 2]),
 *   Seq.fromArray([3]),
 *   Seq.fromArray([]),
 *   Seq.fromArray([4, 5])
 * ]);
 * console.log([...Seq.flatten(nested)]); // [1, 2, 3, 4, 5]
 */
export const flatten = <T>(seqOfSeq: Seq<Seq<T>>): Seq<T> => {
    return create(() => {
        const outerIt = seqOfSeq[Symbol.iterator]();
        let innerIt: Iterator<T> | null = null;

        return {
            next(): IteratorResult<T> {
                // Try to pull from the current inner iterator
                while (true) {
                    if (innerIt) {
                        const nxt = innerIt.next();
                        if (!nxt.done) {
                            return { done: false, value: nxt.value };
                        }
                        // inner is exhausted; move on
                        innerIt = null;
                    }

                    // Advance to the next inner sequence
                    const outerNext = outerIt.next();
                    if (outerNext.done) {
                        // no more subsequences
                        return { done: true, value: undefined as any };
                    }

                    // start iterating the next subsequence
                    innerIt = outerNext.value[Symbol.iterator]();
                }
            }
        };
    });
};

/**
 * Returns a sequence of adjacent pairs from the input sequence.
 *
 * For a sequence [a, b, c, d], produces [[a,b], [b,c], [c,d]].
 *
 * @param seq - The input sequence.
 * @returns A lazy sequence of sliding pairs.
 *
 * @example
 * const seq = Seq.fromArray([1, 2, 3, 4]);
 * console.log([...pairwise(seq)]); // [[1,2], [2,3], [3,4]]
 */
export const pairwise = <T>(seq: Seq<T>): Seq<[T, T]> => {
    return create(() => {
        const it = seq[Symbol.iterator]();
        let prev = it.next();
        return {
            next(): IteratorResult<[T, T]> {
                if (prev.done) return { done: true, value: undefined as any };
                const curr = it.next();
                if (curr.done) return { done: true, value: undefined as any };
                const pair: [T, T] = [prev.value, curr.value];
                prev = { value: curr.value, done: false };
                return { done: false, value: pair };
            }
        };
    });
};

/**
 * Returns a sequence of unique elements by key function.
 *
 * Only the first occurrence of each key is kept.
 *
 * @param fn - Function mapping each element to a key.
 * @param seq - The input sequence.
 * @returns A sequence of distinct elements.
 *
 * @example
 * const seq = Seq.fromArray([{id:1},{id:2},{id:1}]);
 * console.log([...distinctBy(x => x.id, seq)]); // [{id:1},{id:2}]
 */
export const distinctBy = <T, K>(fn: (value: T) => K) => (seq: Seq<T>): Seq<T> => {
    return create(() => {
        const it = seq[Symbol.iterator]();
        const seen = new Set<K>();
        return {
            next(): IteratorResult<T> {
                while (true) {
                    const nxt = it.next();
                    if (nxt.done) return { done: true, value: undefined as any };
                    const key = fn(nxt.value);
                    if (!seen.has(key)) {
                        seen.add(key);
                        return { done: false, value: nxt.value };
                    }
                }
            }
        };
    });
};

/**
 * Shuffles the elements of a sequence in random order.
 *
 * This is an _eager_ operation: the entire sequence is first consumed,
 * shuffled in memory, then returned as a new sequence.
 *
 * @param seq - The input sequence.
 * @returns A sequence with elements in random order.
 *
 * @example
 * const seq = Seq.fromArray([1, 2, 3, 4]);
 * console.log([...shuffle(seq)]); // e.g. [3,1,4,2]
 */
export const shuffle = <T>(seq: Seq<T>): Seq<T> => {
    const arr = [...seq];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j] as T, arr[i] as T];
    }
    return fromArray(arr);
};

/**
 * Inserts a separator element between every two elements of the input sequence.
 *
 * Lazily emits:
 *  - the first element,
 *  - then alternately the separator and the next element,
 *  until the source is exhausted.
 *
 * @param sep – The separator to insert.
 * @param seq – The input sequence.
 * @returns A new `Seq<T>` with separators interleaved.
 *
 * @example
 * const seq = Seq.fromArray([1, 2, 3]);
 * console.log([...intersperse(0, seq)]); // [1, 0, 2, 0, 3]
 */
export const intersperse = <T>(sep: T) => (seq: Seq<T>): Seq<T> =>
    create(() => {
        const it = seq[Symbol.iterator]();
        let first = true;
        let pending = false;
        let nextVal!: T;

        return {
            next(): IteratorResult<T> {
                // If we’re holding a nextVal, emit it now
                if (pending) {
                    pending = false;
                    return { done: false, value: nextVal };
                }

                // Otherwise pull the next raw value
                const { value, done } = it.next();
                if (done) return { done: true, value: undefined as any };

                if (first) {
                    first = false;
                    return { done: false, value };
                }

                // After the first, we emit sep, then hold the current value
                pending = true;
                nextVal = value;
                return { done: false, value: sep };
            }
        };
    });

/**
 * Splits a sequence into contiguous slices whenever the predicate returns true.
 *
 * Boundaries themselves are not included in output.
 * Yields one `Seq<T>` per slice. **Empty** input yields **no** slices.
 * A leading boundary yields an empty first slice; trailing boundary does not yield an extra.
 *
 * @param fn – Predicate to detect slice boundaries.
 * @param seq – The input sequence.
 * @returns A `Seq<Seq<T>>` of slices.
 *
 * @example
 * const seq = Seq.fromArray([1,0,2,0,3]);
 * console.log(
 *   [...sliceBy(x => x === 0, seq)].map(s => [...s])
 * ); // [[1],[2],[3]]
 *
 * @example
 * // leading boundary yields empty first slice
 * const seq2 = Seq.fromArray([0,1,2]);
 * console.log(
 *   [...sliceBy(x => x === 0, seq2)].map(s => [...s])
 * ); // [[], [1,2]]
 */
export const sliceBy = <T>(fn: (value: T) => boolean) => (seq: Seq<T>): Seq<Seq<T>> =>
    create(() => {
        const it = seq[Symbol.iterator]();
        let done = false;

        return {
            next(): IteratorResult<Seq<T>> {
                if (done) return { done: true, value: undefined as any };

                const bucket: T[] = [];
                while (true) {
                    const { value, done: d } = it.next();
                    if (d) {
                        done = true;
                        break;
                    }
                    if (fn(value)) {
                        // boundary: end current slice, do not include the boundary element
                        break;
                    }
                    bucket.push(value);
                }

                // If this is an empty final bucket, end iteration
                if (done && bucket.length === 0) {
                    return { done: true, value: undefined as any };
                }

                // Emit this slice
                return { done: false, value: fromArray(bucket) };
            }
        };
    });

const _EMPTY: Seq<never> = create(() => ({
    next(): IteratorResult<never> {
        return { done: true, value: undefined as any };
    }
}));

export const empty = <T>(): Seq<T> => _EMPTY as Seq<T>;

const Seq = {
    create,
    fromArray,
    toArray,
    toArrayUnsafe,
    unfold,
    range,
    fib,
    enumerate,
    repeat,
    cycle,
    cycleN,
    flatten,
    pairwise,
    distinctBy,
    shuffle,
    intersperse,
    sliceBy,
    empty,
}

export default Seq
