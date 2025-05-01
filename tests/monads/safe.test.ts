import { test, expect } from 'bun:test';
import { Safe, tap } from '../../src'; // Adjust path if needed!
import { attempt, biIter, compact, flatMap, fold, ifFailure, ifSuccess, isError, isSuccess, iter, map, match, recover, recoverWith, toEither, toOption, unwrap, unwrapOr } from '../../src/monads/safe';
import { isLeft, left, right } from '../../src/monads/either';
import { isSome, none, optional, some } from '../../src/monads/option';
import { fail } from '../../src/err';

test('Safe.attempt captures success', () => {
  const result = Safe.attempt(() => 42);

  expect(Safe.isSuccess(result)).toBe(true);
  expect(Safe.isError(result)).toBe(false);
  expect(Safe.unwrap(result)).toBe(42);
});

test('Safe.attempt captures failure', () => {
  const result = Safe.attempt(() => { throw new Error('fail') });

  expect(Safe.isError(result)).toBe(true);
  expect(Safe.isSuccess(result)).toBe(false);
  expect(() => Safe.unwrap(result)).toThrow('Unwrapping a failed Safe<T>');
});

test('Safe.map transforms success value', () => {
  const safeValue = Safe.attempt(() => 10);
  const mapped = Safe.map((x: number) => x * 2)(safeValue);

  expect(Safe.isSuccess(mapped)).toBe(true);
  expect(Safe.unwrap(mapped)).toBe(20);
});

test('Safe.map does nothing to error', () => {
  const safeError = Safe.attempt(() => { throw new Error('fail') });
  const mapped = Safe.map((x: number) => x * 2)(safeError);

  expect(Safe.isError(mapped)).toBe(true);
});

test('Safe.flatMap chains computations', () => {
  const safeValue = Safe.attempt(() => 5);
  const chained = Safe.flatMap((n: number) => Safe.attempt(() => n + 5))(safeValue);

  expect(Safe.isSuccess(chained)).toBe(true);
  expect(Safe.unwrap(chained)).toBe(10);
});

test('Safe.flatMap preserves error', () => {
  const safeError = Safe.attempt(() => { throw new Error('fail') });
  const chained = Safe.flatMap((n: number) => Safe.attempt(() => n + 5))(safeError);

  expect(Safe.isError(chained)).toBe(true);
});

test('Safe.fold handles success and error correctly', () => {
  const safeValue = Safe.attempt(() => 100);
  const safeError = Safe.attempt(() => { throw new Error('fail') });

  const foldedSuccess = Safe.fold(
    (n: number) => `success: ${n}`,
    () => 'error'
  )(safeValue);

  const foldedError = Safe.fold(
    (n: number) => `success: ${n}`,
    () => 'error'
  )(safeError);

  expect(foldedSuccess).toBe('success: 100');
  expect(foldedError).toBe('error');
});

test('Safe.match behaves like fold', () => {
  const safeValue = Safe.attempt(() => 1);
  const safeError = Safe.attempt(() => { throw new Error('fail') });

  const matchedSuccess = Safe.match(
    (n: number) => `ok: ${n}`,
    () => 'error'
  )(safeValue);

  const matchedError = Safe.match(
    (n: number) => `ok: ${n}`,
    () => 'error'
  )(safeError);

  expect(matchedSuccess).toBe('ok: 1');
  expect(matchedError).toBe('error');
});

test('Safe.unwrapOr returns value for success', () => {
  const safeValue = Safe.attempt(() => 123);
  const result = Safe.unwrapOr(0)(safeValue);

  expect(result).toBe(123);
});

test('Safe.unwrapOr returns default for error', () => {
  const safeError = Safe.attempt(() => { throw new Error('fail') });
  const result = Safe.unwrapOr(999)(safeError);

  expect(result).toBe(999);
});

test('Safe.recover transforms error into success', () => {
  const safeError = Safe.attempt(() => { throw new Error('fail') });
  const recovered = Safe.recover(() => 999)(safeError);

  expect(Safe.isSuccess(recovered)).toBe(true);
  expect(Safe.unwrap(recovered)).toBe(999);
});

test('Safe.recoverWith chains recovery', () => {
  const safeError = Safe.attempt(() => { throw new Error('fail') });
  const recovered = Safe.recoverWith(() => Safe.attempt(() => 777))(safeError);

  expect(Safe.isSuccess(recovered)).toBe(true);
  expect(Safe.unwrap(recovered)).toBe(777);
});

test('Safe.ifFailure runs side-effect on error', () => {
  const safeError = Safe.attempt(() => { throw new Error('fail') });
  let called = false;

  Safe.ifFailure(() => { called = true })(safeError);

  expect(called).toBe(true);
});

test('Safe.ifSuccess runs side-effect on success', () => {
  const safeValue = Safe.attempt(() => 'ok');
  let captured = '';

  Safe.ifSuccess((val: string) => { captured = val })(safeValue);

  expect(captured).toBe('ok');
});

test('Safe.unwrap throws on error', () => {
  const safeError = Safe.attempt(() => { throw new Error('fail') });

  expect(() => Safe.unwrap(safeError)).toThrow('Unwrapping a failed Safe<T>');
});

test('Safe.unwrap returns value on success', () => {
  const safeValue = Safe.attempt(() => 42);
  const result = Safe.unwrap(safeValue);

  expect(result).toBe(42);
});

test('Safe.compact filters and unwraps successful values', () => {
  const safes = [
    Safe.attempt(() => 1),
    Safe.attempt(() => { throw new Error('fail') }),
    Safe.attempt(() => 3),
  ];

  const result = Safe.compact(safes);

  expect(result).toEqual([1, 3]);
});

test('Safe.compact returns empty array for all errors', () => {
  const safes = [
    Safe.attempt(() => { throw new Error('fail1') }),
    Safe.attempt(() => { throw new Error('fail2') }),
  ];

  const result = Safe.compact(safes);

  expect(result).toEqual([]);
});

test('Safe.tap runs function for success', () => {
  const safeValue = Safe.attempt(() => 10);
  let result = 0;

  Safe.tap((x: number) => { result = x })(safeValue);

  expect(result).toBe(10);
});


test('Safe.iter runs function for success', () => {
  const safeValue = Safe.attempt(() => 20);
  let result = 0;

  Safe.iter((x: number) => { result = x })(safeValue);

  expect(result).toBe(20);
});

test('Safe.iter does nothing for error', () => {
  const safeError = Safe.attempt(() => { throw new Error('fail') });
  let called = false;

  Safe.iter(() => { called = true })(safeError);

  expect(called).toBe(false);
});

test('Safe.flatten flattens nested Safe', () => {
  const nestedSafe = Safe.attempt(() => Safe.attempt(() => 42));
  const flattened = Safe.flatten(nestedSafe);

  expect(Safe.isSuccess(flattened)).toBe(true);
  expect(Safe.unwrap(flattened)).toBe(42);
});

test('Safe.flatten preserves error', () => {
  const nestedError = Safe.attempt(() => Safe.attempt(() => { throw new Error('fail') }));
  const flattened = Safe.flatten(nestedError);

  expect(Safe.isError(flattened)).toBe(true);
});

test('Safe JSON.stringify for success', () => {
  const safeValue = Safe.attempt(() => 100);
  const jsonValue = JSON.stringify(safeValue);

  expect(jsonValue).toBe(JSON.stringify({
    type: 'SUCCESS',
    value: 100
  }));
});

test('Safe JSON.stringify for error', () => {
  const safeError = Safe.attempt(() => { throw 'fail' });
  const jsonValue = JSON.stringify(safeError);

  expect(jsonValue).toBe(JSON.stringify({
    type: 'FAILURE',
    cause: 'fail'
  }));
});

test('Safe.attempt wraps success and failure', () => {
  const ok = attempt(() => 123);
  expect(isSuccess(ok)).toBe(true);
  if (isSuccess(ok)) {
    expect(ok.value).toBe(123);
  }

  const err = attempt(() => { throw 'X'; });
  expect(isError(err)).toBe(true);
  if (isError(err)) {
    expect(err.cause).toBe('X');
  }
});

test('Safe.map transforms success, propagates failure', () => {
  const t1 = attempt(() => 2);
  const m1 = map((n: number) => n + 3)(t1);
  expect(isSuccess(m1) && m1.value).toBe(5);

  const t2 = attempt(() => { throw 9; });
  const m2 = map((n: number) => n + 3)(t2);
  expect(isError(m2)).toBe(true);
  if (isError(m2)) {
    expect(m2.cause).toBe(9);
  }
});

test('Safe.flatMap chains new Safe or propagates failure', () => {
  const base = attempt(() => 10);
  const chained = flatMap((n: number) => attempt(() => n * 2))(base);
  expect(isSuccess(chained) && chained.value).toBe(20);

  const baseErr = attempt(() => { throw 'boom'; });
  const chained2 = flatMap((n: number) => attempt(() => n * 2))(baseErr);
  expect(isError(chained2)).toBe(true);
  if (isError(chained2)) {
    expect(chained2.cause).toBe('boom');
  }
});

test('Safe.fold/match picks correct handler', () => {
  const ok = attempt(() => 'hi');
  const out1 = fold(
    (s: string) => s + '!',
    (_: any) => 'fail'
  )(ok);
  expect(out1).toBe('hi!');

  const bad = attempt(() => { throw 42; });
  const out2 = match(
    (s: number) => s.toString(),
    (e) => `err:${e.cause}`
  )(bad);
  expect(out2).toBe('err:42');
});

test('Safe.isError / isSuccess type guards', () => {
  const ok = attempt(() => true);
  expect(isSuccess(ok)).toBe(true);
  expect(isError(ok)).toBe(false);

  const bad = attempt(() => { throw null; });
  expect(isError(bad)).toBe(true);
  expect(isSuccess(bad)).toBe(false);
});

test('Safe.unwrapOr returns value or default', () => {
  const ok = attempt(() => 7);
  expect(unwrapOr(99)(ok)).toBe(7);

  const bad = attempt(() => { throw 'nope'; });
  expect(unwrapOr(99)(bad)).toBe(99);
});

test('Safe.recover transforms failure into success', () => {
  const bad = attempt(() => { throw 'err'; });
  const rec = recover((_e) => 55)(bad);
  expect(isSuccess(rec)).toBe(true);
  if (isSuccess(rec)) {
    expect(rec.value).toBe(55);
  }

  // success path unchanged
  const ok = attempt(() => 3);
  const rec2 = recover((_e) => 0)(ok);
  expect(isSuccess(rec2) && rec2.value).toBe(3);
});

test('Safe.recoverWith substitutes alternate Safe', () => {
  const bad = attempt(() => { throw 'X'; });
  const rec = recoverWith((_e) => attempt(() => 77))(bad);
  expect(isSuccess(rec) && rec.value).toBe(77);

  // on success, returns original
  const ok = attempt(() => 5);
  const rec2 = recoverWith((_e) => attempt(() => 0))(ok);
  expect(isSuccess(rec2) && rec2.value).toBe(5);
});

test('Safe.ifFailure calls only on error', () => {
  let seen: unknown = null;
  const handler = ifFailure((e) => { seen = e.cause; });

  const bad = attempt(() => { throw 'oops'; });
  handler(bad);
  expect(seen).toBe('oops');

  seen = null;
  const ok = attempt(() => 1);
  handler(ok);
  expect(seen).toBe(null);
});

test('Safe.ifSuccess calls only on success', () => {
  let seen: number | null = null;
  const handler = ifSuccess((n: number) => { seen = n; });

  const ok = attempt(() => 123);
  handler(ok);
  expect(seen).toBe(123 as any);

  seen = null;
  const bad = attempt(() => { throw 'no'; });
  handler(bad);
  expect(seen).toBe(null);
});

test('Safe.unwrap returns value or throws', () => {
  const ok = attempt(() => 'hey');
  expect(unwrap(ok)).toBe('hey');

  const bad = attempt(() => { throw 'X'; });
  expect(() => unwrap(bad)).toThrow('Unwrapping a failed Safe<T>');
});

test('Safe.compact filters successes and unwraps', () => {
  const arr = [
    attempt(() => 1),
    attempt(() => { throw 'a'; }),
    attempt(() => 2),
  ];
  expect(compact(arr)).toEqual([1, 2]);
});

test('Safe.iter performs side-effect on success only', () => {
  let x = 0;
  const fn = iter((n: number) => { x = n; });

  const ok = attempt(() => 9);
  fn(ok);
  expect(x).toBe(9);

  fn(attempt(() => { throw 0; }));
  expect(x).toBe(9);
});

test('Safe.biIter branches side-effects correctly', () => {
  let a: any = null, b: any = null;
  const fn = biIter(
    (v) => { a = v; },
    (e) => { b = e.cause; }
  );

  fn(attempt(() => 2));
  expect(a).toBe(2);
  expect(b).toBe(null);

  a = null;
  fn(attempt(() => { throw 'bad'; }));
  expect(a).toBe(null);
  expect(b).toBe('bad');
});

test('Safe.tap returns original Safe after effect', () => {
  let seen: number | null = null;
  const fn = tap((n: number) => { seen = n; });

  const ok = attempt(() => 8);
  const out = fn(Safe.unwrap(ok));
  expect(out).toBe(8);
  expect(seen).toBe(8 as any);
});

test('Safe.toEither converts Safe to Either', () => {
  // success case
  const ok = attempt(() => 7);
  const rightE = toEither(ok);
  expect(isLeft(rightE)).toBe(false);
  // rightE should be a right carrying the value 7
  expect((rightE as any).value).toBe(7);

  // failure case
  const bad = attempt(() => { throw 'X'; });
  const leftE = toEither(bad);
  expect(isLeft(leftE)).toBe(true);
  // and its payload must be the exact same failure object
  expect((leftE as any).value).toBe(bad);
});

test('Safe.toOption converts success to Some and failure to none', () => {
  const ok = attempt(() => 'z');
  const opt = toOption(ok);

  // make sure it’s a Some
  expect(opt.type).toBe('SOME');
  if (isSome(opt)) {
    expect(opt.value).toBe('z');
  }

  const bad = attempt(() => { throw new Error('nope') });
  const optBad = toOption(bad);
  expect(optBad).toBe(none); // both are the shared `none` singleton
});