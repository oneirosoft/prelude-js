import { SafeOption, Option, Either, Safe } from '../../src/';
import { test, expect } from 'bun:test';
import { unwrap } from '../../src/monads/safeOption';
import { none } from '../../src/monads/option';

test('SafeOption.fold handles Some', () => {
  const result = SafeOption.fold(
    x => `value: ${x}`,
    () => 'none',
    err => `error: ${err}`
  )(SafeOption.attempt(() => 10));
  expect(result).toBe('value: 10');
});

test('SafeOption.fold handles None', () => {
  const result = SafeOption.fold(
    x => `value: ${x}`,
    () => 'none',
    err => `error: ${err}`
  )(SafeOption.attempt(() => null));
  expect(result).toBe('none');
});

test('SafeOption.fold handles Failure', () => {
  const result = SafeOption.fold(
    x => `value: ${x}`,
    () => 'none',
    err => `error: ${err.cause}`
  )(SafeOption.attempt(() => { throw 'boom' }));
  expect(result).toBe('error: boom');
});

test('SafeOption.match is an alias for fold', () => {
  const result = SafeOption.match(
    x => `value: ${x}`,
    () => 'none',
    err => `fail: ${err.cause}`
  )(SafeOption.attempt(() => 5));
  expect(result).toBe('value: 5');
});

test('SafeOption.unwrapOrElse returns value from Some', () => {
  const result = SafeOption.unwrapOrElse(999)(SafeOption.attempt(() => 123));
  expect(result).toBe(123);
});

test('SafeOption.unwrapOrElse returns default for None', () => {
  const result = SafeOption.unwrapOrElse(999)(SafeOption.attempt<number>(() => null));
  expect(result).toBe(999);
});

test('SafeOption.unwrapOrElse returns default for Failure', () => {
  const result = SafeOption.unwrapOrElse(999)(SafeOption.attempt(() => { throw 'fail' }));
  expect(result).toBe(999);
});

test('SafeOption.iter runs side-effect on Some', () => {
  let called = false;
  SafeOption.iter(() => { called = true })(SafeOption.attempt(() => 42));
  expect(called).toBe(true);
});

test('SafeOption.iter does nothing on None', () => {
  let called = false;
  SafeOption.iter(() => { called = true })(SafeOption.attempt(() => null));
  expect(called).toBe(false);
});

test('SafeOption.iter does nothing on Failure', () => {
  let called = false;
  SafeOption.iter(() => { called = true })(SafeOption.attempt(() => { throw 'fail' }));
  expect(called).toBe(false);
});

test('SafeOption.tap runs side-effect and returns SafeOption', () => {
  let tapped = 0;
  const input = SafeOption.attempt(() => 10);
  const result = SafeOption.tap<number>(x => { tapped = x })(input);
  expect(result).toEqual(input);
  expect(tapped).toBe(10);
});

test('SafeOption.ifSome executes only on Some', () => {
  let called = false;
  SafeOption.ifSome(() => { called = true })(SafeOption.attempt(() => 1));
  expect(called).toBe(true);
});

test('SafeOption.ifNone executes only on None', () => {
  let called = false;
  SafeOption.ifNone(() => { called = true })(SafeOption.attempt(() => null));
  expect(called).toBe(true);
});

test('SafeOption.ifFailure executes only on Failure', () => {
  let cause: unknown = null;
  SafeOption.ifFailure(err => { cause = err.cause })(SafeOption.attempt(() => { throw 'oops' }));
  expect(cause).toBe('oops');
});

test('SafeOption.recover transforms Failure to Some', () => {
  const result = SafeOption.recover(() => 99)(SafeOption.attempt(() => { throw 'fail' }));
  expect(SafeOption.isSome(result)).toBe(true);
  expect(SafeOption.unwrap(result)).toBe(99);
});

test('SafeOption.recover returns unchanged for Some', () => {
  const input = SafeOption.attempt(() => 7);
  const result = SafeOption.recover(() => 99)(input);
  expect(result).toEqual(input);
});

test('SafeOption.recover returns unchanged for None', () => {
  const input = SafeOption.attempt<number>(() => null);
  const result = SafeOption.recover(() => 99)(input);
  expect(result).toEqual(input);
});

test('SafeOption.recoverWith transforms Failure', () => {
  const result = SafeOption.recoverWith(() => SafeOption.attempt(() => 88))(SafeOption.attempt(() => { throw 'fail' }));
  expect(SafeOption.isSome(result)).toBe(true);
  expect(SafeOption.unwrap(result)).toBe(88);
});

test('SafeOption.recoverWith returns unchanged for Some', () => {
  const input = SafeOption.attempt(() => 77);
  const result = SafeOption.recoverWith(() => SafeOption.attempt(() => 0))(input);
  expect(result).toEqual(input);
});

test('SafeOption.recoverWith returns unchanged for None', () => {
  const input = SafeOption.attempt<number>(() => null);
  const result = SafeOption.recoverWith(() => SafeOption.attempt(() => 0))(input);
  expect(result).toEqual(input);
});

test('SafeOption.compact filters and unwraps only Some values', () => {
  const arr = [
    SafeOption.attempt(() => 1),
    SafeOption.attempt(() => null),
    SafeOption.attempt(() => 2),
    SafeOption.attempt(() => { throw 'fail' }),
    SafeOption.attempt(() => 3),
  ];
  const result = SafeOption.compact(arr.values());
  expect(Array.from(result)).toEqual([1, 2, 3]);
});

test('SafeOption.flatten collapses nested SafeOption', () => {
  const nested = SafeOption.attempt(() => SafeOption.attempt(() => 42));
  const result = SafeOption.flatten(nested);
  expect(SafeOption.isSome(result)).toBe(true);
  expect(SafeOption.unwrap(result)).toBe(42);
});


test('SafeOption.toOption returns Some when SafeOption is Some', () => {
    const input = SafeOption.attempt(() => 42);
    const result = SafeOption.toOption(input);
    expect(Option.isSome(result)).toBe(true);
    expect(Option.unwrap(result)).toBe(42);
  });
  
  test('SafeOption.toOption returns None when SafeOption is None', () => {
    const input = SafeOption.attempt(() => null);
    const result = SafeOption.toOption(input);
    expect(Option.isNone(result)).toBe(true);
  });
  
  test('SafeOption.toOption returns None when SafeOption is Failure', () => {
    const input = SafeOption.attempt(() => { throw 'fail' });
    const result = SafeOption.toOption(input);
    expect(Option.isNone(result)).toBe(true);
  });
  
  test('SafeOption.toEither wraps Some into Right', () => {
    const input = SafeOption.attempt(() => 100);
    const result = SafeOption.toEither(input);
    expect(Either.isRight(result)).toBe(true);
    expect(Option.unwrap(Either.unwrap(result))).toBe(100);
  });
  
  test('SafeOption.toEither wraps None into Right', () => {
    const input = SafeOption.attempt(() => null);
    const result = SafeOption.toEither(input);
    expect(Either.isRight(result)).toBe(true);
    expect(Option.isNone(Either.unwrap(result))).toBe(true);
  });
  
  test('SafeOption.toEither wraps Failure into Left', () => {
    const input = SafeOption.attempt(() => { throw new Error('boom') });
    const result = SafeOption.toEither(input);
    expect(Either.isLeft(result)).toBe(true);
    expect(Either.unwrapLeft(result).type).toBe('FAILURE');
  });
  
  test('SafeOption.toSafe converts Some to Safe', () => {
    const input = SafeOption.attempt(() => 50);
    const result = SafeOption.toSafe(input);
    expect(Safe.isSuccess(result)).toBe(true);
    expect(Safe.unwrap(result)).toBe(50);
  });
  
  test('SafeOption.toSafe converts None to Failure Safe', () => {
    const input = SafeOption.attempt(() => null);
    const result = SafeOption.toSafe(input);
    expect(Safe.isError(result)).toBe(true);
    expect(() => Safe.unwrap(result)).toThrow('Unwrapping a failed Safe<T>');
  });
  
  test('SafeOption.toSafe converts Failure to Failure Safe', () => {
    const input = SafeOption.attempt(() => { throw 'fail' });
    const result = SafeOption.toSafe(input);
    expect(Safe.isError(result)).toBe(true);
  });

  test("unwrap throws if given None", () => {
    expect(() => unwrap(none)).toThrow("Cannot unwrap failure or none");
  });
  
  test("unwrap throws if given Failure", () => {
    const failure = {
      type: "FAILURE" as const,
      cause: "bad things",
      toJson: () => ({ type: "FAILURE", cause: "bad things" })
    };
  
    expect(() => unwrap(failure)).toThrow("Cannot unwrap failure or none");
  });