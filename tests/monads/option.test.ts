import { test, expect, vi } from 'bun:test';
import { Option } from '../../src'; // Adjust path if needed!
import { isNone, isSome, none, optional, some, toEither, unwrap } from '../../src/monads/option';
import E from '../../src/monads/either';

test('Option.some creates a Some', () => {
  const some = Option.some(42);

  expect(Option.isSome(some)).toBe(true);
  expect(Option.isNone(some)).toBe(false);
  expect(some.type).toBe('SOME');
  expect(Option.unwrap(some)).toBe(42);
});

test('Option.none creates a None', () => {
  const none = Option.none;

  expect(Option.isSome(none)).toBe(false);
  expect(Option.isNone(none)).toBe(true);
  expect(none.type).toBe('NONE');
});

test('Option.map applies function to Some', () => {
  const some = Option.some(10);
  const mapped = Option.map((n: number) => n * 2)(some);

  expect(Option.isSome(mapped)).toBe(true);
  expect(mapped.type).toBe('SOME');
  expect(Option.unwrap(mapped)).toBe(20);
});

test('Option.map does nothing to None', () => {
  const none = Option.none;
  const mapped = Option.map((n: number) => n * 2)(none);

  expect(Option.isNone(mapped)).toBe(true);
});

test('Option.flatMap applies function to Some', () => {
  const some = Option.some(5);
  const flatMapped = Option.flatMap((n: number) => Option.some(n + 5))(some);

  expect(Option.isSome(flatMapped)).toBe(true);
  expect(flatMapped.type).toBe('SOME');
  expect(Option.unwrap(flatMapped)).toBe(10);
});

test('Option.flatMap does nothing to None', () => {
  const none = Option.none;
  const flatMapped = Option.flatMap((n: number) => Option.some(n + 5))(none);

  expect(Option.isNone(flatMapped)).toBe(true);
});

test('Option.fold returns correct value for Some', () => {
  const some = Option.some(100);
  const folded = Option.fold(
    (n: number) => `value: ${n}`,
    () => 'none'
  )(some);

  expect(folded).toBe('value: 100');
});

test('Option.fold returns correct value for None', () => {
  const none = Option.none;
  const folded = Option.fold(
    (n: number) => `value: ${n}`,
    () => 'none'
  )(none);

  expect(folded).toBe('none');
});

test('Option.match behaves same as fold for Some', () => {
  const some = Option.some(1);
  const matched = Option.match(
    (n: number) => `matched: ${n}`,
    () => 'none'
  )(some);

  expect(matched).toBe('matched: 1');
});

test('Option.match behaves same as fold for None', () => {
  const none = Option.none;
  const matched = Option.match(
    (n: number) => `matched: ${n}`,
    () => 'no value'
  )(none);

  expect(matched).toBe('no value');
});

test('Option.getOrElse returns value for Some', () => {
  const some = Option.some(123);
  const value = Option.getOrElse(0)(some);

  expect(value).toBe(123);
});

test('Option.getOrElse returns default for None', () => {
  const none = Option.none;
  const value = Option.getOrElse(999)(none);

  expect(value).toBe(999);
});

test('Option.iter runs function for Some', () => {
  const some = Option.some(5);
  let result = 0;

  Option.iter((n: number) => {
    result = n * 2;
  })(some);

  expect(result).toBe(10);
});

test('Option.iter does nothing for None', () => {
  const none = Option.none;
  let result = 0;

  Option.iter((n: number) => {
    result = n * 2;
  })(none);

  expect(result).toBe(0); // unchanged
});

test('Option.ifSome runs function for Some', () => {
  const some = Option.some('hello');
  let called = false;
  let captured = '';

  Option.ifSome((val: string) => {
    called = true;
    captured = val;
  })(some);

  expect(called).toBe(true);
  expect(captured).toBe('hello');
});

test('Option.ifSome does nothing for None', () => {
  const none = Option.none;
  let called = false;

  Option.ifSome((val) => {
    called = true;
  })(none);

  expect(called).toBe(false);
});

test('Option.ifNone runs function for None', () => {
  const none = Option.none;
  let called = false;

  Option.ifNone(() => {
    called = true;
  })(none);

  expect(called).toBe(true);
});

test('Option.ifNone does nothing for Some', () => {
  const some = Option.some('world');
  let called = false;

  Option.ifNone(() => {
    called = true;
  })(some);

  expect(called).toBe(false);
});

test('Option.unwrap returns value for Some', () => {
  const some = Option.some(42);
  const result = Option.unwrap(some);

  expect(result).toBe(42);
});

test('Option.unwrap throws error for None', () => {
  const none = Option.none;

  expect(() => Option.unwrap(none)).toThrowError('Cannot unwrap None');
});

test('Option.unwrap throws custom error message', () => {
  const none = Option.none;

  expect(() => Option.unwrap(none, 'Expected a value')).toThrowError('Expected a value');
});

test('Option.filter returns Some if predicate is true', () => {
  const some = Option.some(10);
  const filtered = Option.filter((n: number) => n > 5)(some);

  expect(Option.isSome(filtered)).toBe(true);
  expect(filtered.type).toBe('SOME');
  expect(Option.unwrap(filtered)).toBe(10);
});

test('Option.compact filters and unwraps an array of Options', () => {
  const options = [
    Option.some(1),
    Option.none,
    Option.some(3),
    Option.none,
    Option.some(5),
  ];

  const result = Option.compact(options);

  expect(result).toEqual([1, 3, 5]);
});

test('Option.compact returns empty array for all None', () => {
  const options = [
    Option.none,
    Option.none,
  ];

  const result = Option.compact(options);

  expect(result).toEqual([]);
});

test('Option.tap runs function for Some', () => {
  const some = Option.some(10);
  let result = 0;

  const tapped = Option.tap((n: number) => {
    result = n * 2;
  })(some);

  expect(result).toBe(20);
  expect(Option.isSome(tapped)).toBe(true);
  expect(tapped.type).toBe('SOME');
  expect(Option.unwrap(tapped)).toBe(10);
});

test('Option.tap does nothing for None', () => {
  const none = Option.none;
  let called = false;

  const tapped = Option.tap(() => {
    called = true;
  })(none);

  expect(called).toBe(false);
  expect(Option.isNone(tapped)).toBe(true);
});

test('Option JSON.stringify for Some', () => {
  const some = Option.some(42);
  const jsonString = JSON.stringify(some);

  expect(jsonString).toBe('{"type":"SOME","value":42}');
});

test('Option JSON.stringify for None', () => {
  const none = Option.none;
  const jsonString = JSON.stringify(none);

  expect(jsonString).toBe('{"type":"NONE"}');
});

test('Option.flatten flattens nested Some', () => {
  const nestedSome = Option.some(Option.some(42));
  const flattened = Option.flatten(nestedSome);

  expect(Option.isSome(flattened)).toBe(true);
  expect(flattened.type).toBe('SOME');
  expect(Option.unwrap(flattened)).toBe(42);
});

test('Option.flatten returns None for nested None', () => {
  const nestedNone = Option.some(Option.none);
  const flattened = Option.flatten(nestedNone);

  expect(Option.isNone(flattened)).toBe(true);
});

test('Option.biIter calls onSome when option is some', () => {
  const onSome = vi.fn();
  const onNone = vi.fn();

  const run = Option.biIter(onSome, onNone);
  run(Option.some(42));

  expect(onSome).toHaveBeenCalledWith(42);
  expect(onNone).not.toHaveBeenCalled();
});

test('Option.biIter calls onNone when option is none', () => {
  const onSome = vi.fn();
  const onNone = vi.fn();

  const run = Option.biIter(onSome, onNone);
  run(Option.none);

  expect(onNone).toHaveBeenCalled();
  expect(onSome).not.toHaveBeenCalled();
});

test('Option.biIter handles complex types in some', () => {
  const obj = { name: 'Alice', age: 30 };
  const onSome = vi.fn();
  const onNone = vi.fn();

  const run = Option.biIter(onSome, onNone);
  run(Option.some(obj));

  expect(onSome).toHaveBeenCalledWith(obj);
  expect(onNone).not.toHaveBeenCalled();
});

test('Option.biIter can be reused across multiple calls', () => {
  const onSome = vi.fn();
  const onNone = vi.fn();

  const run = Option.biIter(onSome, onNone);
  run(Option.some('hello'));
  run(Option.none);
  run(Option.some('world'));

  expect(onSome).toHaveBeenCalledTimes(2);
  expect(onSome).toHaveBeenNthCalledWith(1, 'hello');
  expect(onSome).toHaveBeenNthCalledWith(2, 'world');
  expect(onNone).toHaveBeenCalledTimes(1);
});

test('optional returns none for null', () => {
  expect(isNone(optional(null))).toBe(true);
});

test('optional returns none for undefined', () => {
  expect(isNone(optional(undefined))).toBe(true);
});

test('optional returns some for defined value', () => {
  const opt = optional('hello');
  expect(isSome(opt)).toBe(true);
  expect(unwrap(opt)).toBe('hello');
});

test('toEither converts some to right', () => {
  const opt = some(42);
  const either = toEither(opt);
  expect(E.isRight(either)).toBe(true);
  expect(E.unwrap(either)).toBe(42);
});

test('toEither converts none to left with undefined', () => {
  const either = toEither(none);
  expect(E.isLeft(either)).toBe(true);
  expect(E.unwrapLeft(either)).toBeUndefined();
});