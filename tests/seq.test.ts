import { test, expect } from 'bun:test';
import { Seq, Option, Safe } from '../src';

test('Seq.fromArray creates correct sequence', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq]).toEqual([1, 2, 3]);
});


test('Seq.flatMap flattens mapped sequences', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    const result = seq.flatMap(x => Seq.fromArray([x, x * 10]));
    expect([...result]).toEqual([1, 10, 2, 20, 3, 30]);
});

test('Seq.flatMap works on empty sequence', () => {
    const empty = Seq.fromArray<number>([]);
    const result = empty.flatMap(x => Seq.fromArray([x, x * 2]));
    expect([...result]).toEqual([]);
});

test('Seq.flatMap short-circuits lazily', () => {
    let log: number[] = [];
    const seq = Seq.fromArray([1, 2, 3]).flatMap(x => {
        log.push(x);
        return Seq.fromArray([x]);
    });
    const first = seq.head();
    expect(first.type).toBe('SOME');
    expect(log).toEqual([1]);
});

test('Seq.flatMap produces empty sequence if all mapped sequences are empty', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    const result = seq.flatMap(() => Seq.fromArray([]));
    expect([...result]).toEqual([]);
});

test('Seq.flatMap supports nested flatMap calls', () => {
    const seq = Seq.fromArray([1, 2]);
    const result = seq.flatMap(x =>
        Seq.fromArray([x]).flatMap(y => Seq.fromArray([y, y + 1]))
    );
    expect([...result]).toEqual([1, 2, 2, 3]);
});

test('Seq.flatMap lazily generates inner sequences', () => {
    const calls: number[] = [];
    const seq = Seq.fromArray([1, 2, 3]).flatMap(x => {
        calls.push(x);
        return Seq.fromArray([x * 10]);
    });

    // Only trigger one iteration
    const first = seq.head();
    expect(first.type).toBe('SOME');
    expect(calls).toEqual([1]); // Only first item processed
});

test('Seq.zip combines two sequences element-wise', () => {
    const a = Seq.fromArray([1, 2, 3]);
    const b = Seq.fromArray(['a', 'b', 'c']);
    const zipped = a.zip(b);
    expect([...zipped]).toEqual([[1, 'a'], [2, 'b'], [3, 'c']]);
});

test('Seq.zip truncates to shorter length', () => {
    const a = Seq.fromArray([1, 2]);
    const b = Seq.fromArray(['x', 'y', 'z']);
    const zipped = a.zip(b);
    expect([...zipped]).toEqual([[1, 'x'], [2, 'y']]);
});

test('Seq.zip with empty sequence results in empty output', () => {
    const a = Seq.fromArray<number>([]);
    const b = Seq.fromArray(['a', 'b']);
    const zipped = a.zip(b);
    expect([...zipped]).toEqual([]);
});

test('Seq.zip truncates to empty if first sequence is shorter', () => {
    const a = Seq.fromArray([1]);
    const b = Seq.fromArray(['a', 'b', 'c']);
    expect([...a.zip(b)]).toEqual([[1, 'a']]);
});

test('Seq.zip truncates to empty if second sequence is shorter', () => {
    const a = Seq.fromArray([1, 2, 3]);
    const b = Seq.fromArray(['x']);
    expect([...a.zip(b)]).toEqual([[1, 'x']]);
});

test('Seq.zip with both empty sequences yields empty sequence', () => {
    const a = Seq.fromArray<number>([]);
    const b = Seq.fromArray<string>([]);
    expect([...a.zip(b)]).toEqual([]);
});

test('Seq.zip preserves laziness', () => {
    let aCount = 0, bCount = 0;

    const a = Seq.fromArray([1, 2, 3]).map(x => {
        aCount++;
        return x;
    });

    const b = Seq.fromArray(['a', 'b', 'c']).map(x => {
        bCount++;
        return x;
    });

    const zipped = a.zip(b);
    const first = zipped.head();

    expect(first.type).toBe('SOME');
    expect(aCount).toBe(1);
    expect(bCount).toBe(1);
});

test('Seq.map transforms elements', () => {
    const seq = Seq.fromArray([1, 2, 3]).map(x => x * 2);
    expect([...seq]).toEqual([2, 4, 6]);
});

test('Seq.map handles empty sequence with index', () => {
    const seq = Seq.fromArray<number>([]);
    const result = seq.map((x, i) => x + i);
    expect([...result]).toEqual([]);
});

test('Seq.map supports computation using both value and index', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    const result = seq.map((value, index) => value + index);
    expect([...result]).toEqual([1, 3, 5]); // 1+0, 2+1, 3+2
});

test('Seq.filter removes unwanted elements', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]).filter(x => x % 2 === 0);
    expect([...seq]).toEqual([2, 4]);
});

test('Seq.reduce folds correctly', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    const result = seq.reduce((sum, val) => sum + val, 0);
    expect(result).toBe(10);
});

test('Seq.get retrieves correct values', () => {
    const seq = Seq.fromArray([10, 20, 30]);
    expect(Option.unwrap(seq.get(0))).toBe(10);
    expect(Option.unwrap(seq.get(1))).toBe(20);
    expect(Option.unwrap(seq.get(2))).toBe(30);
});

test('Seq.head returns first element', () => {
    const seq = Seq.fromArray([42, 99]);
    expect(Option.unwrap(seq.head())).toBe(42);
});

test('Seq.tail returns remaining sequence', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    const tail = seq.tail();
    expect([...tail]).toEqual([2, 3]);
});

test('Seq.take returns first n elements', () => {
    const seq = Seq.fromArray([5, 6, 7, 8]);
    expect([...seq.take(2)]).toEqual([5, 6]);
});

test('Seq.drop skips first n elements', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    expect([...seq.drop(2)]).toEqual([3, 4]);
});

test('Seq.forEach executes side effect', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    let acc = 0;
    seq.forEach(n => { acc += n });
    expect(acc).toBe(6);
});

test('Seq.find locates first match', () => {
    const seq = Seq.fromArray([5, 6, 7]);
    expect(Option.unwrap(seq.find(n => n > 5))).toBe(6);
});

test('Seq.some detects matching element', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect(seq.some(n => n === 2)).toBe(true);
    expect(seq.some(n => n === 4)).toBe(false);
});

test('Seq.every ensures all match', () => {
    const seq = Seq.fromArray([2, 4, 6]);
    expect(seq.every(n => n % 2 === 0)).toBe(true);
    expect(seq.every(n => n > 2)).toBe(false);
});

test('Seq.isEmpty reflects content correctly', () => {
    const empty = Seq.fromArray([]);
    const nonEmpty = Seq.fromArray([1]);
    expect(empty.isEmpty()).toBe(true);
    expect(nonEmpty.isEmpty()).toBe(false);
});

test('Seq.length counts length within limit', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    const result = seq.length(10);
    expect(Safe.isSuccess(result)).toBe(true);
    expect(Safe.unwrap(result)).toBe(4);
});

test('Seq.length returns failure when exceeding max', () => {
    const seq = Seq.fromArray([1, 2, 3, 4, 5]);
    const result = seq.length(2);
    expect(Safe.isError(result)).toBe(true);
});

test('Seq.lengthUnsafe returns count regardless of size', () => {
    const seq = Seq.fromArray([1, 2, 3, 4, 5]);
    expect(seq.lengthUnsafe()).toBe(5);
});

test('Seq.append adds to end', () => {
    const seq = Seq.fromArray([1, 2]).append(3);
    expect([...seq]).toEqual([1, 2, 3]);
});

test('Seq.prepend adds to front', () => {
    const seq = Seq.fromArray([2, 3]).prepend(1);
    expect([...seq]).toEqual([1, 2, 3]);
});

test('Seq.unfold generates values lazily', () => {
    const naturals = Seq.unfold<number, number>(n => n < 3 ? Option.some([n, n + 1]) : Option.none)(0);
    expect([...naturals]).toEqual([0, 1, 2]);
});

test('Seq.groupBy groups elements by key', () => {
    const seq = Seq.fromArray(['apple', 'banana', 'apricot', 'blueberry']);
    const grouped = seq.groupBy(s => s[0]); // group by first letter

    expect([...grouped.get('a')!]).toEqual(['apple', 'apricot']);
    expect([...grouped.get('b')!]).toEqual(['banana', 'blueberry']);
});

test('Seq.groupBy handles empty sequence', () => {
    const seq = Seq.fromArray<string>([]);
    const grouped = seq.groupBy(s => s.length);
    expect(grouped.size).toBe(0);
});

test('Seq.partition splits elements based on predicate', () => {
    const seq = Seq.fromArray([1, 2, 3, 4, 5]);
    const [evens, odds] = seq.partition(x => x % 2 === 0);

    expect([...evens]).toEqual([2, 4]);
    expect([...odds]).toEqual([1, 3, 5]);
});

test('Seq.partition with all false returns all in second', () => {
    const seq = Seq.fromArray([1, 3, 5]);
    const [pass, fail] = seq.partition(x => x % 2 === 0);

    expect([...pass]).toEqual([]);
    expect([...fail]).toEqual([1, 3, 5]);
});

test('Seq.distinct removes duplicate values', () => {
    const seq = Seq.fromArray([1, 2, 2, 3, 3, 3, 4]);
    const distinct = seq.distinct();
    expect([...distinct]).toEqual([1, 2, 3, 4]);
});

test('Seq.distinct on empty sequence returns empty', () => {
    const seq = Seq.fromArray<number>([]);
    expect([...seq.distinct()]).toEqual([]);
});

test('Seq.scan accumulates intermediate results', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    const running = seq.scan((acc, x) => acc + x, 0);
    expect([...running]).toEqual([1, 3, 6]);
});

test('Seq.scan on empty sequence returns empty', () => {
    const seq = Seq.fromArray<number>([]);
    const scanned = seq.scan((acc, x) => acc + x, 0);
    expect([...scanned]).toEqual([]);
});

test('Seq.last returns the final element', () => {
    const seq = Seq.fromArray([10, 20, 30]);
    const last = seq.last();
    expect(last.type).toBe('SOME');
    expect(Option.unwrap(last)).toBe(30);
});

test('Seq.last on empty sequence returns none', () => {
    const seq = Seq.fromArray<number>([]);
    const last = seq.last();
    expect(last.type).toBe('NONE');
});

test('Seq.reverse returns reversed seq within limit', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    const result = seq.reverse(10);
    expect(Safe.isSuccess(result)).toBe(true);
    expect([...Safe.unwrap(result)]).toEqual([3, 2, 1]);
});

test('Seq.reverse returns failure if sequence too long', () => {
    const seq = Seq.fromArray([1, 2, 3, 4, 5]);
    const result = seq.reverse(3);
    expect(Safe.isError(result)).toBe(true);
});

test('Seq.reverseUnsafe returns reversed sequence', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq.reverseUnsafe()]).toEqual([3, 2, 1]);
});

test('Seq.reverseUnsafe on empty sequence returns empty', () => {
    const seq = Seq.fromArray<number>([]);
    expect([...seq.reverseUnsafe()]).toEqual([]);
});

test('Seq.toArray returns full array safely within max', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    const result = Seq.toArray(seq, 10);
    expect(Safe.isSuccess(result)).toBe(true);
    expect(Safe.unwrap(result)).toEqual([1, 2, 3]);
});

test('Seq.toArray fails if sequence exceeds max', () => {
    const seq = Seq.fromArray([1, 2, 3, 4, 5]);
    const result = Seq.toArray(seq, 3);
    expect(Safe.isError(result)).toBe(true);
});

test('Seq.toArrayUnsafe returns full array with no safety', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    const arr = Seq.toArrayUnsafe(seq);
    expect(arr).toEqual([1, 2, 3]);
});

test('Seq.slice extracts correct range of elements', () => {
    const seq = Seq.fromArray([10, 20, 30, 40, 50]);
    const sliced = seq.slice(1, 4);
    expect([...sliced]).toEqual([20, 30, 40]);
});

test('Seq.slice with only start returns elements to end', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    const sliced = seq.slice(2);
    expect([...sliced]).toEqual([3, 4]);
});

test('Seq.slice with start equal to length returns empty sequence', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    const sliced = seq.slice(3);
    expect([...sliced]).toEqual([]);
});

test('Seq.slice with start greater than length returns empty sequence', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    const sliced = seq.slice(10);
    expect([...sliced]).toEqual([]);
});

test('Seq.slice with end less than start returns empty sequence', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    const sliced = seq.slice(3, 2);
    expect([...sliced]).toEqual([]);
});

test('Seq.slice with end beyond sequence length truncates correctly', () => {
    const seq = Seq.fromArray([10, 20, 30]);
    const sliced = seq.slice(1, 10);
    expect([...sliced]).toEqual([20, 30]);
});

test('Seq.slice from 0 returns full sequence when end is not provided', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq.slice(0)]).toEqual([1, 2, 3]);
});

test('Seq.slice preserves laziness', () => {
    let log: number[] = [];
    const seq = Seq.fromArray([1, 2, 3, 4]).map(x => {
        log.push(x);
        return x;
    });

    const sliced = seq.slice(1, 3);
    const first = sliced.head();
    expect(first.type).toBe('SOME');
    expect(log).toEqual([1, 2]); // Only elements up to 2 evaluated
});

test('Seq.chunk divides evenly', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    const chunks = seq.chunk(2);
    const result = [...chunks].map(c => [...c]);
    expect(result).toEqual([[1, 2], [3, 4]]);
});

test('Seq.chunk handles remainder', () => {
    const seq = Seq.fromArray([1, 2, 3, 4, 5]);
    const result = [...seq.chunk(2)].map(c => [...c]);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
});

test('Seq.chunk with size larger than length returns single chunk', () => {
    const seq = Seq.fromArray([1, 2]);
    expect([...seq.chunk(10)].map(c => [...c])).toEqual([[1, 2]]);
});

test('Seq.chunk on empty sequence is empty', () => {
    const seq = Seq.fromArray<number>([]);
    expect([...seq.chunk(3)]).toEqual([]);
});

test('Seq.chunk with size 1 returns singleton chunks', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq.chunk(1)].map(c => [...c])).toEqual([[1], [2], [3]]);
});

test('Seq.chunk throws for size <= 0', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect(() => [...seq.chunk(0)]).toThrow();
});

test('Seq.chunkBy groups consecutive keys', () => {
    const seq = Seq.fromArray([1, 1, 2, 2, 2, 3, 1]);
    const result = [...seq.chunkBy(x => x)].map(c => [...c]);
    expect(result).toEqual([[1, 1], [2, 2, 2], [3], [1]]);
});

test('Seq.chunkBy creates new group on key change', () => {
    const seq = Seq.fromArray(['a', 'a', 'b', 'a', 'a']);
    const result = [...seq.chunkBy(x => x)].map(c => [...c]);
    expect(result).toEqual([['a', 'a'], ['b'], ['a', 'a']]);
});

test('Seq.chunkBy handles empty input', () => {
    const seq = Seq.fromArray<string>([]);
    expect([...seq.chunkBy(x => x)]).toEqual([]);
});

test('Seq.window creates sliding windows', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    const result = [...seq.window(2)].map(c => [...c]);
    expect(result).toEqual([[1, 2], [2, 3], [3, 4]]);
});

test('Seq.window handles single window', () => {
    const seq = Seq.fromArray([1, 2]);
    const result = [...seq.window(2)].map(c => [...c]);
    expect(result).toEqual([[1, 2]]);
});

test('Seq.window with window larger than sequence returns empty', () => {
    const seq = Seq.fromArray([1, 2]);
    const result = [...seq.window(3)];
    expect(result).toEqual([]);
});

test('Seq.window with size 1 yields singletons', () => {
    const seq = Seq.fromArray([4, 5, 6]);
    const result = [...seq.window(1)].map(c => [...c]);
    expect(result).toEqual([[4], [5], [6]]);
});

test('Seq.window throws for size <= 0', () => {
    const seq = Seq.fromArray([1, 2]);
    expect(() => [...seq.window(0)]).toThrow();
});

test('Seq.range generates numbers from start to end - 1', () => {
    const r = Seq.range(0, 5);
    expect([...r]).toEqual([0, 1, 2, 3, 4]);
});

test('Seq.range with start >= end returns empty sequence', () => {
    expect([...Seq.range(5, 5)]).toEqual([]);
    expect([...Seq.range(10, 5)]).toEqual([]);
});

test('Seq.range handles negative ranges', () => {
    expect([...Seq.range(-3, 1)]).toEqual([-3, -2, -1, 0]);
});

test('Seq.range evaluates lazily', () => {
    let count = 0;
    const r = Seq.range(0, 1000).map(x => {
        count++;
        return x;
    });
    const first = r.head();
    expect(count).toBe(1);
    expect(first.type).toBe('SOME');
    expect(Option.unwrap(first)).toBe(0);
});

test('Seq.fib generates the correct first 10 Fibonacci numbers', () => {
    const expected = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
    const first10 = Seq.fib.take(10);
    expect([...first10]).toEqual(expected);
});

test('Seq.fib is lazy (only computes what is accessed)', () => {
    const accessed: number[] = [];
    const trackedFib = Seq.fib.map(n => {
        accessed.push(n);
        return n;
    });

    const head = trackedFib.head();
    expect(head.type).toBe('SOME');
    expect(Option.unwrap(head)).toBe(0);
    expect(accessed).toEqual([0]); // Only first element is evaluated
});

test('Seq.fib can be mapped and filtered safely', () => {
    const evens = Seq.fib.filter(n => n % 2 === 0).take(5);
    expect([...evens]).toEqual([0, 2, 8, 34, 144]); // First 5 even Fibonacci numbers
});

test('Seq.fib with take(0) returns empty sequence', () => {
    const empty = Seq.fib.take(0);
    expect([...empty]).toEqual([]);
});

test('Seq.fib can be reduced', () => {
    const sum = Seq.fib.take(7).reduce((acc, val) => acc + val, 0);
    expect(sum).toBe(20); // 0 + 1 + 1 + 2 + 3 + 5 + 8
});

test('Seq.enumerate pairs index with elements', () => {
    const seq = Seq.fromArray(['a', 'b', 'c']);
    const result = Seq.enumerate(seq);
    expect([...result]).toEqual([
        [0, 'a'],
        [1, 'b'],
        [2, 'c']
    ]);
});

test('Seq.enumerate on empty sequence returns empty', () => {
    const seq = Seq.fromArray<string>([]);
    const result = Seq.enumerate(seq);
    expect([...result]).toEqual([]);
});

test('Seq.repeat creates finite repeated values', () => {
    const repeated = Seq.repeat('x', 4);
    expect([...repeated]).toEqual(['x', 'x', 'x', 'x']);
});

test('Seq.repeat with 0 times returns empty sequence', () => {
    const repeated = Seq.repeat('y', 0);
    expect([...repeated]).toEqual([]);
});

test('Seq.repeat with 1 returns single element', () => {
    const repeated = Seq.repeat('z', 1);
    expect([...repeated]).toEqual(['z']);
});

test('Seq.cycle loops values indefinitely (capped by take)', () => {
    const seq = Seq.cycle(['A', 'B']).take(5);
    expect([...seq]).toEqual(['A', 'B', 'A', 'B', 'A']);
});

test('Seq.cycle with single element repeats it', () => {
    const seq = Seq.cycle(['Z']).take(4);
    expect([...seq]).toEqual(['Z', 'Z', 'Z', 'Z']);
});

test('Seq.cycle with empty array returns empty sequence', () => {
    const seq = Seq.cycle([]).take(5);
    expect([...seq]).toEqual([]); // remains empty even when take is applied
});

test('Seq.cycleN repeats array n times', () => {
    const result = Seq.cycleN(['a', 'b'], 3);
    expect([...result]).toEqual(['a', 'b', 'a', 'b', 'a', 'b']);
});

test('Seq.cycleN with n = 0 returns empty sequence', () => {
    const result = Seq.cycleN(['x', 'y', 'z'], 0);
    expect([...result]).toEqual([]);
});

test('Seq.cycleN with n = 1 returns array once', () => {
    const result = Seq.cycleN([1, 2, 3], 1);
    expect([...result]).toEqual([1, 2, 3]);
});

test('Seq.cycleN with empty array returns empty sequence regardless of n', () => {
    const result1 = Seq.cycleN([], 0);
    const result2 = Seq.cycleN([], 5);
    expect([...result1]).toEqual([]);
    expect([...result2]).toEqual([]);
});

test('Seq.cycleN works with numbers', () => {
    const result = Seq.cycleN([10, 20], 2);
    expect([...result]).toEqual([10, 20, 10, 20]);
});

test('Seq.cycleN preserves laziness', () => {
    let accessed: number[] = [];

    const result = Seq.cycleN([1, 2, 3], 2).map(x => {
        accessed.push(x);
        return x;
    });

    const head = result.head();
    expect(head.type).toBe('SOME');
    expect(accessed).toEqual([1]);
});

// none(fn)
test('Seq.none returns true if no elements match', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect(seq.none(x => x > 10)).toBe(true);
});

test('Seq.none returns false if some elements match', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect(seq.none(x => x === 2)).toBe(false);
});

// count(fn?)
test('Seq.count returns total number of elements if no predicate', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    expect(seq.count()).toBe(4);
});

test('Seq.count returns number of matching elements', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    expect(seq.count(x => x % 2 === 0)).toBe(2);
});

// startsWith

test('Seq.startsWith returns true when matching sequence', () => {
    const a = Seq.fromArray([1, 2, 3]);
    const b = Seq.fromArray([1, 2]);
    expect(a.startsWith(b)).toBe(true);
});

test('Seq.startsWith returns false when mismatched sequence', () => {
    const a = Seq.fromArray([1, 2, 3]);
    const b = Seq.fromArray([2, 3]);
    expect(a.startsWith(b)).toBe(false);
});

// endsWith

test('Seq.endsWith returns true when ending matches', () => {
    const a = Seq.fromArray([1, 2, 3, 4]);
    const b = Seq.fromArray([3, 4]);
    expect(a.endsWith(b)).toBe(true);
});

test('Seq.endsWith returns false when ending does not match', () => {
    const a = Seq.fromArray([1, 2, 3]);
    const b = Seq.fromArray([2, 4]);
    expect(a.endsWith(b)).toBe(false);
});

// insertAt

test('Seq.insertAt inserts correctly at index', () => {
    const seq = Seq.fromArray([1, 3]);
    const result = seq.insertAt(1, 2);
    expect([...result]).toEqual([1, 2, 3]);
});

test('Seq.insertAt at beginning', () => {
    const seq = Seq.fromArray([2, 3]);
    expect([...seq.insertAt(0, 1)]).toEqual([1, 2, 3]);
});

test('Seq.insertAt at end', () => {
    const seq = Seq.fromArray([1, 2]);
    expect([...seq.insertAt(2, 3)]).toEqual([1, 2, 3]);
});

// removeAt

test('Seq.removeAt removes element at index', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq.removeAt(1)]).toEqual([1, 3]);
});

test('Seq.removeAt with invalid index does nothing', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq.removeAt(10)]).toEqual([1, 2, 3]);
});

// replaceAt

test('Seq.replaceAt replaces element at index', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq.replaceAt(1, 20)]).toEqual([1, 20, 3]);
});

test('Seq.replaceAt with invalid index leaves sequence unchanged', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq.replaceAt(5, 99)]).toEqual([1, 2, 3]);
});

test('Seq.flatten merges nested sequences of numbers', () => {
    const nested = Seq.fromArray([
        Seq.fromArray([1, 2]),
        Seq.fromArray([3]),
        Seq.fromArray([4, 5])
    ]);
    expect([...Seq.flatten(nested)]).toEqual([1, 2, 3, 4, 5]);
});

test('Seq.flatten on empty outer sequence yields empty', () => {
    const nested = Seq.fromArray([]);
    expect([...Seq.flatten(nested)]).toEqual([]);
});

test('Seq.flatten skips empty inner sequences', () => {
    const nested = Seq.fromArray([
        Seq.fromArray<number>([]),
        Seq.fromArray([10]),
        Seq.fromArray<number>([]),
        Seq.fromArray([20, 30])
    ]);
    expect([...Seq.flatten(nested)]).toEqual([10, 20, 30]);
});

test('Seq.flatten works on deeply nested singletons', () => {
    const nested = Seq.fromArray([
        Seq.fromArray([42])
    ]);
    expect([...Seq.flatten(nested)]).toEqual([42]);
});

test('Seq.flatten preserves laziness (does not iterate subsequent subsequences)', () => {
    const calls: string[] = [];

    // first subsequence is finite [1,2]
    const first = Seq.fromArray([1, 2]);
    // second subsequence should never be touched
    const second = Seq.create<number>(() => ({
        next() {
            calls.push('second');
            return { done: true, value: undefined as any };
        }
    }));

    const nested = Seq.fromArray([first, second]);
    const flat = Seq.flatten(nested);

    // grab exactly one item via the iterator
    const it = flat[Symbol.iterator]();
    const one = it.next();
    expect(one.done).toBe(false);
    expect(one.value).toBe(1);

    // we should NOT have touched the second subsequence at all
    expect(calls).toEqual([]);
});

// pairwise

test('Seq.pairwise on [1,2,3] yields adjacent pairs', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq.pairwise()]).toEqual([[1, 2], [2, 3]]);
});

test('Seq.pairwise on empty or single yields empty', () => {
    expect([...Seq.fromArray<number>([]).pairwise()]).toEqual([]);
    expect([...Seq.fromArray([1]).pairwise()]).toEqual([]);
});

// distinctBy

test('Seq.distinctBy filters by key function', () => {
    const seq = Seq.fromArray(['a', 'A', 'b', 'B', 'a']);
    expect([...seq.distinctBy(x => x.toLowerCase())]).toEqual(['a', 'b']);
});

test('Seq.distinctBy on empty yields empty', () => {
    expect([...Seq.fromArray<number>([]).distinctBy(x => x)]).toEqual([]);
});

// shuffle

test('Seq.shuffle preserves elements and length', () => {
    const arr = [1, 2, 3, 4, 5];
    const seq = Seq.fromArray(arr);
    const shuffled = seq.shuffle();
    const out = [...shuffled];
    expect(out).toEqual(expect.arrayContaining(arr));
    expect(out).toHaveLength(arr.length);
    expect(out.sort()).toEqual(arr);
});

test('Seq.shuffle on empty yields empty', () => {
    expect([...Seq.fromArray<number>([]).shuffle()]).toEqual([]);
});

// intersperse

test('Seq.intersperse inserts separator correctly', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq.intersperse(0)]).toEqual([1, 0, 2, 0, 3]);
});

test('Seq.intersperse on single yields single', () => {
    expect([...Seq.fromArray([42]).intersperse(0)]).toEqual([42]);
});

test('Seq.intersperse on empty yields empty', () => {
    expect([...Seq.fromArray<number>([]).intersperse(9)]).toEqual([]);
});

// sliceBy

test('Seq.sliceBy splits on predicate boundaries', () => {
    const seq = Seq.fromArray([1, 0, 2, 0, 3]);
    const chunks = [...seq.sliceBy(x => x === 0)].map(c => [...c]);
    expect(chunks).toEqual([[1], [2], [3]]);
});

test('Seq.sliceBy with no boundaries returns single chunk', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    const chunks = [...seq.sliceBy(x => false)].map(c => [...c]);
    expect(chunks).toEqual([[1, 2, 3]]);
});

test('Seq.sliceBy boundary at start yields leading empty chunk', () => {
    const seq = Seq.fromArray([0, 1, 2]);
    const chunks = [...seq.sliceBy(x => x === 0)].map(c => [...c]);
    expect(chunks).toEqual([[], [1, 2]]);
});

test('Seq.sliceBy on empty yields empty', () => {
    const seq = Seq.fromArray<number>([]);
    expect([...seq.sliceBy(x => true)]).toEqual([]);
});

test('Seq.empty head() is none', () => {
    const e = Seq.empty<number>();
    expect(e.head().type).toBe('NONE');
  });
  
  test('Seq.empty.get returns none for any index', () => {
    const e = Seq.empty<string>();
    expect(e.get(0).type).toBe('NONE');
    expect(e.get(42).type).toBe('NONE');
  });
  
  test('Seq.empty iterator yields no elements', () => {
    const e = Seq.empty<boolean>();
    expect([...e]).toEqual([]);
  });
  
  test('Seq.empty.values() yields no elements', () => {
    const e = Seq.empty<number>();
    expect([...e.values()]).toEqual([]);
  });
  
  test('Seq.empty.isEmpty() returns true', () => {
    const e = Seq.empty<number>();
    expect(e.isEmpty()).toBe(true);
  });
  
  test('Seq.empty.lengthUnsafe() returns 0', () => {
    const e = Seq.empty<any>();
    expect(e.lengthUnsafe()).toBe(0);
  });
  
  test('Seq.empty.map/filter/take/drop stay empty', () => {
    const e = Seq.empty<number>();
    expect([...e.map(x => x * 2)]).toEqual([]);
    expect([...e.filter(x => x !== 0)]).toEqual([]);
    expect([...e.take(5)]).toEqual([]);
    expect([...e.drop(5)]).toEqual([]);
  });
  
  test('Seq.empty.append produces single-element seq', () => {
    const e = Seq.empty<number>();
    const one = e.append(99);
    expect(one.isEmpty()).toBe(false);
    expect(one.head().type).toBe('SOME');
    expect(Option.unwrap(one.head())).toBe(99);
    expect([...one]).toEqual([99]);
  });
  
  test('Seq.empty is a singleton for all types', () => {
    const e1 = Seq.empty<number>();
    const e2 = Seq.empty<string>();
    expect(e1).toBe(e2 as any);
  });
  
  test('Seq.fromArray([]) behaves like empty()', () => {
    const e1 = Seq.empty<number>();
    const e2 = Seq.fromArray([]);
    expect([...e1]).toEqual([...e2]);
    expect(e1.isEmpty()).toBe(e2.isEmpty());
  });

  test('values() yields same elements as iterator', () => {
  const seq = Seq.fromArray([1, 2, 3]);
  expect([...seq.values()]).toEqual([1, 2, 3]);
});

test('groupBy groups by key and handles empty', () => {
  const seq = Seq.fromArray(['apple', 'banana', 'apricot', 'blue']);
  const grouped = seq.groupBy(s => s[0]);
  expect([...grouped.get('a')!]).toEqual(['apple', 'apricot']);
  expect([...grouped.get('b')!]).toEqual(['banana', 'blue']);

  const empty = Seq.fromArray<number>([]);
  const emptyMap = empty.groupBy(n => n);
  expect(emptyMap.size).toBe(0);
});

test('partition splits based on predicate and handles all true/all false', () => {
  const seq = Seq.fromArray([1, 2, 3, 4]);
  const [evens, odds] = seq.partition(n => n % 2 === 0);
  expect([...evens]).toEqual([2, 4]);
  expect([...odds]).toEqual([1, 3]);

  const all = Seq.fromArray([1, 3, 5]);
  const [pass, fail] = all.partition(n => n > 0);
  expect([...pass]).toEqual([1, 3, 5]);
  expect([...fail]).toEqual([]);
});

test('distinct removes duplicates and handles empty', () => {
  const seq = Seq.fromArray([1, 2, 2, 3, 3, 3]);
  expect([...seq.distinct()]).toEqual([1, 2, 3]);
  expect([...Seq.fromArray<number>([]).distinct()]).toEqual([]);
});

test('scan accumulates intermediate results and empty returns empty', () => {
  const seq = Seq.fromArray([1, 2, 3]);
  expect([...seq.scan((a, v) => a + v, 0)]).toEqual([1, 3, 6]);
  expect([...Seq.fromArray<number>([]).scan((a, v) => a + v, 0)]).toEqual([]);
});

test('slice handles start > end and no end', () => {
  const seq = Seq.fromArray([10, 20, 30, 40]);
  expect([...seq.slice(2, 2)]).toEqual([]);
  expect([...seq.slice(3, 1)]).toEqual([]);
  expect([...seq.slice(1)]).toEqual([20, 30, 40]);
  expect([...seq.slice(10)]).toEqual([]);
});

test('chunk throws on non-positive size, and divides evenly & with remainder', () => {
  const seq = Seq.fromArray([1, 2, 3, 4, 5]);
  expect(() => [...seq.chunk(0)]).toThrow();
  expect(
    [...Seq.fromArray([1, 2, 3, 4]).chunk(2)].map(c => [...c])
  ).toEqual([[1, 2], [3, 4]]);
  expect(
    [...seq.chunk(2)].map(c => [...c])
  ).toEqual([[1, 2], [3, 4], [5]]);
});

test('chunkBy groups contiguous keys and handles empty', () => {
  const seq = Seq.fromArray([1, 1, 2, 2, 3, 1]);
  expect(
    [...seq.chunkBy(x => x)].map(c => [...c])
  ).toEqual([[1, 1], [2, 2], [3], [1]]);
  expect([...Seq.fromArray<number>([]).chunkBy(x => x)]).toEqual([]);
});

test('window throws for size <=0, and works for size 1 and larger', () => {
  const seq = Seq.fromArray([1, 2, 3, 4]);
  expect(() => [...seq.window(0)]).toThrow();
  expect(
    [...Seq.fromArray([1, 2, 3]).window(1)].map(c => [...c])
  ).toEqual([[1], [2], [3]]);
  expect(
    [...seq.window(2)].map(c => [...c])
  ).toEqual([[1, 2], [2, 3], [3, 4]]);
});

test('none returns true if no elements satisfy predicate, false otherwise', () => {
  const seq = Seq.fromArray([1, 2, 3]);
  expect(seq.none(x => x > 10)).toBe(true);
  expect(seq.none(x => x === 2)).toBe(false);
});

test('count returns total and predicate count', () => {
  const seq = Seq.fromArray([1, 2, 3, 4]);
  expect(seq.count()).toBe(4);
  expect(seq.count(x => x % 2 === 0)).toBe(2);
});

test('startsWith returns correctly for matching, non-matching, longer prefix', () => {
  const s = Seq.fromArray([1, 2, 3]);
  expect(s.startsWith(Seq.fromArray([1, 2]))).toBe(true);
  expect(s.startsWith(Seq.fromArray([2, 3]))).toBe(false);
  expect(s.startsWith(Seq.fromArray([1, 2, 3, 4]))).toBe(false);
});

test('endsWith returns correctly for matching, non-matching, longer suffix', () => {
  const s = Seq.fromArray([1, 2, 3]);
  expect(s.endsWith(Seq.fromArray([2, 3]))).toBe(true);
  expect(s.endsWith(Seq.fromArray([1, 3]))).toBe(false);
  expect(s.endsWith(Seq.fromArray([0, 1, 2, 3, 4]))).toBe(false);
});

test('insertAt inserts at index and no-change for out-of-bounds', () => {
  const base = Seq.fromArray([1, 3]);
  expect([...base.insertAt(1, 2)]).toEqual([1, 2, 3]);
  expect([...base.insertAt(0, 0)]).toEqual([0, 1, 3]);
  expect([...base.insertAt(5, 9)]).toEqual([1, 3]);
});

test('removeAt removes element at index and no-change for invalid index', () => {
  const base = Seq.fromArray([1, 2, 3]);
  expect([...base.removeAt(1)]).toEqual([1, 3]);
  expect([...base.removeAt(10)]).toEqual([1, 2, 3]);
});

test('replaceAt replaces element at index and no-change for invalid index', () => {
  const base = Seq.fromArray([1, 2, 3]);
  expect([...base.replaceAt(1, 99)]).toEqual([1, 99, 3]);
  expect([...base.replaceAt(5, 7)]).toEqual([1, 2, 3]);
});

test('flatten alias flattens nested sequences', () => {
  const nested = Seq.fromArray([
    Seq.fromArray([1, 2]),
    Seq.fromArray([3]),
    Seq.fromArray([])
  ]);
  expect([...Seq.flatten(nested)]).toEqual([1, 2, 3]);
});

test('pairwise yields adjacent pairs, empty and single yields empty', () => {
  expect([...Seq.fromArray<number>([]).pairwise()]).toEqual([]);
  expect([...Seq.fromArray([1]).pairwise()]).toEqual([]);
  expect([...Seq.fromArray([1, 2, 3]).pairwise()]).toEqual([[1, 2], [2, 3]]);
});

test('distinctBy filters by key and empty yields empty', () => {
  const seq = Seq.fromArray(['a', 'A', 'b', 'B', 'a']);
  expect([...Seq.distinctBy((x: string) => x.toLowerCase())(seq)]).toEqual(['a', 'b']);
  expect([...Seq.distinctBy((x: number) => x)(Seq.fromArray<number>([]))]).toEqual([]);
});

test('shuffle preserves elements and empty yields empty', () => {
  const arr = [1, 2, 3, 4];
  const out = [...Seq.shuffle(Seq.fromArray(arr))];
  expect(out).toHaveLength(arr.length);
  expect(out.sort()).toEqual(arr);
  expect([...Seq.shuffle(Seq.fromArray<number>([]))]).toEqual([]);
});

test('intersperse inserts separator correctly for normal, single, empty', () => {
  expect([...Seq.intersperse(0)(Seq.fromArray([1, 2, 3]))]).toEqual([1, 0, 2, 0, 3]);
  expect([...Seq.intersperse(0)(Seq.fromArray([42]))]).toEqual([42]);
  expect([...Seq.intersperse(0)(Seq.fromArray<number>([]))]).toEqual([]);
});

test('sliceBy splits on predicate boundaries and handles leading boundary and empty', () => {
  const seq = Seq.fromArray([1, 0, 2, 0, 3]);
  expect(
    [...Seq.sliceBy(x => x === 0)(seq)].map(c => [...c])
  ).toEqual([[1], [2], [3]]);
  const leading = Seq.fromArray([0, 1, 2]);
  expect(
    [...Seq.sliceBy(x => x === 0)(leading)].map(c => [...c])
  ).toEqual([[], [1, 2]]);
  expect([...Seq.sliceBy((x: number) => true)(Seq.fromArray<number>([]))]).toEqual([]);
});

test('empty returns a singleton empty sequence', () => {
  const e1 = Seq.empty<number>();
  const e2 = Seq.empty<number>();
  expect([...e1]).toEqual([]);
  expect(e1).toBe(e2);
});

test('values() yields same elements as iterator', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq.values()]).toEqual([1, 2, 3]);
  });
  
  test('groupBy groups by key and handles empty', () => {
    const seq = Seq.fromArray(['apple', 'banana', 'apricot', 'blue']);
    const grouped = seq.groupBy(s => s[0]);
    expect([...grouped.get('a')!]).toEqual(['apple', 'apricot']);
    expect([...grouped.get('b')!]).toEqual(['banana', 'blue']);
  
    const empty = Seq.fromArray<number>([]);
    const emptyMap = empty.groupBy(n => n);
    expect(emptyMap.size).toBe(0);
  });
  
  test('partition splits based on predicate and handles all true/all false', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    const [evens, odds] = seq.partition(n => n % 2 === 0);
    expect([...evens]).toEqual([2, 4]);
    expect([...odds]).toEqual([1, 3]);
  
    const all = Seq.fromArray([1, 3, 5]);
    const [pass, fail] = all.partition(n => n > 0);
    expect([...pass]).toEqual([1, 3, 5]);
    expect([...fail]).toEqual([]);
  });
  
  test('distinct removes duplicates and handles empty', () => {
    const seq = Seq.fromArray([1, 2, 2, 3, 3, 3]);
    expect([...seq.distinct()]).toEqual([1, 2, 3]);
    expect([...Seq.fromArray<number>([]).distinct()]).toEqual([]);
  });
  
  test('scan accumulates intermediate results and empty returns empty', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect([...seq.scan((a, v) => a + v, 0)]).toEqual([1, 3, 6]);
    expect([...Seq.fromArray<number>([]).scan((a, v) => a + v, 0)]).toEqual([]);
  });
  
  test('slice handles start > end and no end', () => {
    const seq = Seq.fromArray([10, 20, 30, 40]);
    expect([...seq.slice(2, 2)]).toEqual([]);
    expect([...seq.slice(3, 1)]).toEqual([]);
    expect([...seq.slice(1)]).toEqual([20, 30, 40]);
    expect([...seq.slice(10)]).toEqual([]);
  });
  
  test('chunk throws on non-positive size, and divides evenly & with remainder', () => {
    const seq = Seq.fromArray([1, 2, 3, 4, 5]);
    expect(() => [...seq.chunk(0)]).toThrow();
    expect(
      [...Seq.fromArray([1, 2, 3, 4]).chunk(2)].map(c => [...c])
    ).toEqual([[1, 2], [3, 4]]);
    expect(
      [...seq.chunk(2)].map(c => [...c])
    ).toEqual([[1, 2], [3, 4], [5]]);
  });
  
  test('chunkBy groups contiguous keys and handles empty', () => {
    const seq = Seq.fromArray([1, 1, 2, 2, 3, 1]);
    expect(
      [...seq.chunkBy(x => x)].map(c => [...c])
    ).toEqual([[1, 1], [2, 2], [3], [1]]);
    expect([...Seq.fromArray<number>([]).chunkBy(x => x)]).toEqual([]);
  });
  
  test('window throws for size <=0, and works for size 1 and larger', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    expect(() => [...seq.window(0)]).toThrow();
    expect(
      [...Seq.fromArray([1, 2, 3]).window(1)].map(c => [...c])
    ).toEqual([[1], [2], [3]]);
    expect(
      [...seq.window(2)].map(c => [...c])
    ).toEqual([[1, 2], [2, 3], [3, 4]]);
  });
  
  test('none returns true if no elements satisfy predicate, false otherwise', () => {
    const seq = Seq.fromArray([1, 2, 3]);
    expect(seq.none(x => x > 10)).toBe(true);
    expect(seq.none(x => x === 2)).toBe(false);
  });
  
  test('count returns total and predicate count', () => {
    const seq = Seq.fromArray([1, 2, 3, 4]);
    expect(seq.count()).toBe(4);
    expect(seq.count(x => x % 2 === 0)).toBe(2);
  });
  
  test('startsWith returns correctly for matching, non-matching, longer prefix', () => {
    const s = Seq.fromArray([1, 2, 3]);
    expect(s.startsWith(Seq.fromArray([1, 2]))).toBe(true);
    expect(s.startsWith(Seq.fromArray([2, 3]))).toBe(false);
    expect(s.startsWith(Seq.fromArray([1, 2, 3, 4]))).toBe(false);
  });
  
  test('endsWith returns correctly for matching, non-matching, longer suffix', () => {
    const s = Seq.fromArray([1, 2, 3]);
    expect(s.endsWith(Seq.fromArray([2, 3]))).toBe(true);
    expect(s.endsWith(Seq.fromArray([1, 3]))).toBe(false);
    expect(s.endsWith(Seq.fromArray([0, 1, 2, 3, 4]))).toBe(false);
  });
  
  test('insertAt inserts at index and no-change for out-of-bounds', () => {
    const base = Seq.fromArray([1, 3]);
    expect([...base.insertAt(1, 2)]).toEqual([1, 2, 3]);
    expect([...base.insertAt(0, 0)]).toEqual([0, 1, 3]);
    expect([...base.insertAt(5, 9)]).toEqual([1, 3]);
  });
  
  test('removeAt removes element at index and no-change for invalid index', () => {
    const base = Seq.fromArray([1, 2, 3]);
    expect([...base.removeAt(1)]).toEqual([1, 3]);
    expect([...base.removeAt(10)]).toEqual([1, 2, 3]);
  });
  
  test('replaceAt replaces element at index and no-change for invalid index', () => {
    const base = Seq.fromArray([1, 2, 3]);
    expect([...base.replaceAt(1, 99)]).toEqual([1, 99, 3]);
    expect([...base.replaceAt(5, 7)]).toEqual([1, 2, 3]);
  });
  
  test('flatten alias flattens nested sequences', () => {
    const nested = Seq.fromArray([
      Seq.fromArray([1, 2]),
      Seq.fromArray([3]),
      Seq.fromArray([])
    ]);
    expect([...Seq.flatten(nested)]).toEqual([1, 2, 3]);
  });
  
  test('pairwise yields adjacent pairs, empty and single yields empty', () => {
    expect([...Seq.fromArray<number>([]).pairwise()]).toEqual([]);
    expect([...Seq.fromArray([1]).pairwise()]).toEqual([]);
    expect([...Seq.fromArray([1, 2, 3]).pairwise()]).toEqual([[1, 2], [2, 3]]);
  });
  
  test('distinctBy filters by key and empty yields empty', () => {
    const seq = Seq.fromArray(['a', 'A', 'b', 'B', 'a']);
    expect([...Seq.distinctBy((x: string) => x.toLowerCase())(seq)]).toEqual(['a', 'b']);
    expect([...Seq.distinctBy((x: number) => x)(Seq.fromArray<number>([]))]).toEqual([]);
  });
  
  test('shuffle preserves elements and empty yields empty', () => {
    const arr = [1, 2, 3, 4];
    const out = [...Seq.shuffle(Seq.fromArray(arr))];
    expect(out).toHaveLength(arr.length);
    expect(out.sort()).toEqual(arr);
    expect([...Seq.shuffle(Seq.fromArray<number>([]))]).toEqual([]);
  });
  
  test('intersperse inserts separator correctly for normal, single, empty', () => {
    expect([...Seq.intersperse(0)(Seq.fromArray([1, 2, 3]))]).toEqual([1, 0, 2, 0, 3]);
    expect([...Seq.intersperse(0)(Seq.fromArray([42]))]).toEqual([42]);
    expect([...Seq.intersperse(0)(Seq.fromArray<number>([]))]).toEqual([]);
  });
  
  test('sliceBy splits on predicate boundaries and handles leading boundary and empty', () => {
    const seq = Seq.fromArray([1, 0, 2, 0, 3]);
    expect(
      [...Seq.sliceBy(x => x === 0)(seq)].map(c => [...c])
    ).toEqual([[1], [2], [3]]);
    const leading = Seq.fromArray([0, 1, 2]);
    expect(
      [...Seq.sliceBy(x => x === 0)(leading)].map(c => [...c])
    ).toEqual([[], [1, 2]]);
    expect([...Seq.sliceBy((x: number) => true)(Seq.fromArray<number>([]))]).toEqual([]);
  });
  
  test('empty returns a singleton empty sequence', () => {
    const e1 = Seq.empty<number>();
    const e2 = Seq.empty<number>();
    expect([...e1]).toEqual([]);
    expect(e1).toBe(e2);
  });