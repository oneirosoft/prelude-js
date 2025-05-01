import { test, expect } from 'bun:test';
import { isNotNil, cond, condOr, isEven, isOdd, once, oneOf, toPromise, equalsAll, isNil, isObject, id, idAsync, always, memoize, noop, isFunction, select, selectOr, selectSafe, tap, ifNotNil, mapOrIfNotNil, ifNil, mapOrIfNil, onceAsync } from '../src';
import { isNone, unwrap } from '../src/monads/option';

test("once returns result of the first call", () => {
  let count = 0;
  const fn = once((x: number) => {
    count++;
    return x * 2;
  });

  expect(fn(5)).toBe(10);
  expect(fn(10)).toBe(10); // Still returns 10 from first call
  expect(count).toBe(1);   // Function was only called once
});

test("once stores and returns undefined if first call returns undefined", () => {
  let ran = false;
  const fn = once(() => {
    ran = true;
    return undefined;
  });

  expect(fn()).toBeUndefined();
  expect(fn()).toBeUndefined();
  expect(ran).toBe(true);
});

test("once ignores all subsequent arguments", () => {
  let callCount = 0;
  const spy = (a: number) => {
    callCount++;
    return a + 1;
  };

  const wrapped = once(spy);

  expect(wrapped(1)).toBe(2);
  expect(wrapped(999)).toBe(2); // Still returns 2 from first call
  expect(callCount).toBe(1);    // Only called once
});

// (optional) you could test that compose() without args throws, but
// since reduceRight on empty array without init will error, we skip that.

test('isNotNil returns true for non-nil values', () => {
  expect(isNotNil(42)).toBe(true);
  expect(isNotNil('hello')).toBe(true);
  expect(isNotNil({})).toBe(true);
  expect(isNotNil([])).toBe(true);
  expect(isNotNil(() => { })).toBe(true);
});

test('isNotNil returns false for nil values', () => {
  expect(isNotNil(null)).toBe(false);
  expect(isNotNil(undefined)).toBe(false);
});

test('cond applies first matching transform', () => {
  const classify = cond<[number], string>(
    [(x) => x === 0, () => 'zero'],
    [(x) => x > 0, (x) => `positive: ${x}`],
    [(x) => x < 0, (x) => `negative: ${x}`],
  );

  expect(unwrap(classify(0))).toBe('zero');
  expect(unwrap(classify(5))).toBe('positive: 5');
  expect(unwrap(classify(-3))).toBe('negative: -3');
});

test('cond returns none if no match', () => {
  const fn = cond<[number], string>(
    [(x) => false, () => 'never']
  );

  expect(isNone(fn(42))).toBe(true);
});

test('cond uses first predicate that matches', () => {
  const fn = cond<[number], string>(
    [(x) => true, () => 'first'],
    [(x) => true, () => 'second']
  );

  expect(unwrap(fn(1))).toBe('first');
});

test('cond supports multiple arguments', () => {
  const fn = cond<[string, number], string>(
    [(s, n) => s.length === n, (s, n) => `${s} is ${n} characters`],
    [(s, n) => n > 5, (s, n) => `${n} is too long`]
  );

  expect(unwrap(fn('hello', 5))).toBe('hello is 5 characters');
  expect(unwrap(fn('world', 10))).toBe('10 is too long');
});

test('cond returns none if no predicate matches (multiple args)', () => {
  const fn = cond<[string, number], string>(
    [(s, n) => s.length === n, (s, n) => `${s} matches`]
  );

  expect(isNone(fn('nope', 3))).toBe(true);
});

test('cond works with boolean returns', () => {
  const fn = cond<[number], boolean>(
    [(n) => n % 2 === 0, () => true],
    [(n) => n % 2 !== 0, () => false]
  );

  expect(unwrap(fn(2))).toBe(true);
  expect(unwrap(fn(3))).toBe(false);
});

test('cond with no pairs returns none', () => {
  const fn = cond<[number], string>();
  expect(isNone(fn(99))).toBe(true);
});

test('condOr applies first matching transform', () => {
  const classify = condOr((_: number) => 'unknown',
    [(x: number) => x === 0, () => 'zero'],
    [(x: number) => x > 0, x => `positive: ${x}`],
    [(x: number) => x < 0, x => `negative: ${x}`]
  );

  expect(classify(0)).toBe('zero');
  expect(classify(3)).toBe('positive: 3');
  expect(classify(-7)).toBe('negative: -7');
});

test('condOr returns fallback if no predicate matches', () => {
  const fn = condOr((_: string) => 'fallback',
    [(x: string) => x === 'yes', () => 'affirmative']
  );

  expect(fn('no')).toBe('fallback');
});

test('condOr uses first predicate that matches', () => {
  const fn = condOr((_: number) => 'fallback',
    [(x: number) => true, () => 'first'],
    [(x: number) => true, () => 'second']
  );

  expect(fn(5)).toBe('first');
});

test('condOr supports multiple arguments', () => {
  const fn = condOr((_x: string, _y: number) => 'fallback',
    [(s: string, n: number) => s.length === n, (s, n) => `${s} matches`],
    [(s, n) => n > 5, (s, n) => `${n} is too long`]
  );

  expect(fn('hello', 5)).toBe('hello matches');
  expect(fn('toolong', 10)).toBe('10 is too long');
  expect(fn('short', 3)).toBe('fallback');
});

test('condOr works with boolean return values', () => {
  const isEven = condOr(false,
    [(n: number) => n % 2 === 0, () => true]
  );

  expect(isEven(4)).toBe(true);
  expect(isEven(5)).toBe(false);
});

test('condOr with no conditions returns fallback', () => {
  const fn = condOr((_: unknown) => 'default');
  expect(fn(42)).toBe('default');
  expect(fn('hello')).toBe('default');
});


test('isEven returns true for even numbers', () => {
  expect(isEven(0)).toBe(true);
  expect(isEven(2)).toBe(true);
  expect(isEven(100)).toBe(true);
  expect(isEven(-4)).toBe(true);
});

test('isEven returns false for odd numbers', () => {
  expect(isEven(1)).toBe(false);
  expect(isEven(3)).toBe(false);
  expect(isEven(-7)).toBe(false);
});

test('isOdd returns true for odd numbers', () => {
  expect(isOdd(1)).toBe(true);
  expect(isOdd(9)).toBe(true);
  expect(isOdd(-5)).toBe(true);
});

test('isOdd returns false for even numbers', () => {
  expect(isOdd(0)).toBe(false);
  expect(isOdd(10)).toBe(false);
  expect(isOdd(-6)).toBe(false);
});

test('id returns its input unchanged', () => {
  expect(id(123)).toBe(123);
  expect(id('hello')).toBe('hello');
  const obj = { a: 1 };
  expect(id(obj)).toBe(obj);
});

test('idAsync resolves to its input', async () => {
  await expect(idAsync(42)).resolves.toBe(42);
  await expect(idAsync('async')).resolves.toBe('async');
});

test('always returns a function that always returns the given value', () => {
  const alwaysFive = always(5);
  expect(alwaysFive()).toBe(5);
  expect(alwaysFive()).toBe(5);
});

test('noop does nothing and returns undefined', () => {
  expect(noop()).toBeUndefined();
});

test('memoize caches function results', () => {
  let callCount = 0;
  const add = memoize((a: number, b: number) => {
    callCount++;
    return a + b;
  });

  expect(add(1, 2)).toBe(3);
  expect(add(1, 2)).toBe(3);
  expect(add(2, 3)).toBe(5);
  expect(add(2, 3)).toBe(5);
  expect(callCount).toBe(2);
});

test('toPromise wraps non-promises and passes through promises', async () => {
  await expect(toPromise(5)).resolves.toBe(5);

  const p = Promise.resolve(10);
  await expect(toPromise(p)).resolves.toBe(10);
});

test('oneOf checks for value inclusion', () => {
  const isVowel = oneOf('a', 'e', 'i', 'o', 'u');
  expect(isVowel('a')).toBe(true);
  expect(isVowel('b')).toBe(false);
});

test('equalsAll checks if all values equal input', () => {
  const isAllA = equalsAll('a', 'a', 'a');
  expect(isAllA('a')).toBe(true);
  expect(isAllA('b')).toBe(false);
});

test('isNil detects null and undefined', () => {
  expect(isNil(null)).toBe(true);
  expect(isNil(undefined)).toBe(true);
  expect(isNil(0)).toBe(false);
  expect(isNil('')).toBe(false);
});

test('isObject identifies plain objects', () => {
  expect(isObject({})).toBe(true);
  expect(isObject({ a: 1 })).toBe(true);
  expect(isObject([])).toBe(false);
  expect(isObject(null)).toBe(false);
  expect(isObject('string')).toBe(false);
});

test('isFunction identifies functions', () => {
  expect(isFunction(() => {})).toBe(true);
  expect(isFunction(function() {})).toBe(true);
  expect(isFunction(class {})).toBe(true);
  expect(isFunction(123)).toBe(false);
  expect(isFunction('string')).toBe(false);
});

test('tap calls the side-effect function and returns original value', () => {
  const log: number[] = [];

  const tapped = tap((x: number) => log.push(x));
  const result = tapped(42);

  expect(result).toBe(42);          // original value is returned
  expect(log).toEqual([42]);        // side-effect function was called
});

test('ifNotNil applies transformation when value is not nil', () => {
  const double = ifNotNil((n: number) => n * 2);
  expect(double(5)).toBe(10);
});

test('ifNotNil returns null or undefined unchanged', () => {
  const fn = ifNotNil((n: number) => n * 2);
  expect(fn(null as any)).toBeNull();
  expect(fn(undefined as any)).toBeUndefined();
});

test('mapOrIfNotNil applies function when value is not nil', () => {
  const toUpper = mapOrIfNotNil('fallback', (s: string) => s.toUpperCase());
  expect(toUpper('hello')).toBe('HELLO');
});

test('mapOrIfNotNil returns fallback when value is null', () => {
  const getLength = mapOrIfNotNil(0, (s: string) => s.length);
  expect(getLength(null as any)).toBe(0);
});

test('mapOrIfNotNil returns fallback when value is undefined', () => {
  const square = mapOrIfNotNil(999, (n: number) => n * n);
  expect(square(undefined as any)).toBe(999);
});

test('mapOrIfNotNil returns correct type', () => {
  const mapper = mapOrIfNotNil('none', (n: number) => (n > 0 ? 'yes' : 'no'));
  expect(mapper(1)).toBe('yes');
  expect(mapper(undefined as any)).toBe('none');
});

test('ifNil applies function when value is null', () => {
  const fillNull = ifNil(() => 42);
  expect(fillNull(null as any)).toBe(42);
});

test('ifNil applies function when value is undefined', () => {
  const fillUndefined = ifNil(() => 'default');
  expect(fillUndefined(undefined as any)).toBe('default');
});

test('ifNil returns value when not nil', () => {
  const noopIfNotNil = ifNil(() => 99);
  expect(noopIfNotNil(7)).toBe(7);
});

test('mapOrIfNil returns fallback when value is null', () => {
  const fallbackLength = mapOrIfNil(0, (s: string) => s.length);
  expect(fallbackLength(null as any)).toBe(0);
});

test('mapOrIfNil returns fallback when value is undefined', () => {
  const fallbackLength = mapOrIfNil(0, (s: string) => s.length);
  expect(fallbackLength(undefined as any)).toBe(0);
});

test('mapOrIfNil applies function when value is not nil', () => {
  const double = mapOrIfNil(-1, (n: number) => n * 2);
  expect(double(10)).toBe(20);
});


test('oneOf returns true for values in the list', () => {
  const isWeekend = oneOf('Saturday', 'Sunday');
  expect(isWeekend('Saturday')).toBe(true);
  expect(isWeekend('Sunday')).toBe(true);
});

test('oneOf returns false for values not in the list', () => {
  const isYes = oneOf('yes', 'y', 'true');
  expect(isYes('no')).toBe(false);
  expect(isYes('n')).toBe(false);
});

test('oneOf works with numbers', () => {
  const isEven = oneOf(2, 4, 6, 8);
  expect(isEven(4)).toBe(true);
  expect(isEven(5)).toBe(false);
});

test('oneOf works with mixed values', () => {
  const isTruthy = oneOf(true, 1, 'yes');
  expect(isTruthy(1)).toBe(true);
  expect(isTruthy(false)).toBe(false);
});

test('onceAsync resolves to first result', async () => {
  let callCount = 0;
  const fn = async (x: number) => {
    callCount++;
    await new Promise(r => setTimeout(r, 10));
    return x * 2;
  };

  const wrapped = onceAsync(fn);

  const result1 = await wrapped(3);
  const result2 = await wrapped(99); // Ignored input
  expect(result1).toBe(6);
  expect(result2).toBe(6);
  expect(callCount).toBe(1);
});

test('onceAsync calls underlying function only once and reuses result', async () => {
  let callCount = 0;
  const fn = async (x: number) => {
    callCount++;
    return x * 2;
  };

  const wrapped = onceAsync(fn);

  const result1 = await wrapped(5);
  const result2 = await wrapped(999); // this should not trigger a new call

  expect(result1).toBe(10);
  expect(result2).toBe(10);
  expect(callCount).toBe(1); // only called once!
});