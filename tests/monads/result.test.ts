import { test, expect, vi } from 'bun:test';
import * as Result from '../../src/monads/result';

const { ok, error, isOk, isError, map, flatMap, biMap, biFlatMap, fold, match, getOrElse, iter, biIter, filter, ifOk, ifError, tap, compact } = Result;

test('ok creates a successful Result', () => {
  const r = ok(42);
  expect(isOk(r)).toBe(true);
  expect(isError(r)).toBe(false);
  expect(r.type).toBe('OK');
  expect(r.value).toBe(42);
  expect(r.toJSON()).toEqual({ type: 'OK', value: 42 });
});

test('error creates an error Result', () => {
  const r = error('fail');
  expect(isOk(r)).toBe(false);
  expect(isError(r)).toBe(true);
  expect(r.type).toBe('ERROR');
  expect(r.error).toBe('fail');
  expect(r.toJSON()).toEqual({ type: 'ERROR', error: 'fail' });
});

test('map transforms value if ok', () => {
  const r = map((x: number) => x * 2)(ok(10));
  expect(isOk(r)).toBe(true);
  expect(r.value).toBe(20);
});

test('map skips transformation if error', () => {
  const r = map((x: number) => x * 2)(error('fail'));
  expect(isError(r)).toBe(true);
  expect(r.error).toBe('fail');
});

test('flatMap chains Results when ok', () => {
  const r = flatMap((x: number) => ok(x + 5))(ok(10));
  expect(isOk(r)).toBe(true);
  expect(r.value).toBe(15);
});

test('flatMap skips chaining if error', () => {
  const r = flatMap((x: number) => ok(x + 5))(error('fail'));
  expect(isError(r)).toBe(true);
});

test('biMap transforms both sides correctly', () => {
  const okMapped = biMap(x => x * 2, e => `${e}!`)(ok(2));
  expect(isOk(okMapped)).toBe(true);
  expect(okMapped.value).toBe(4);

  const errMapped = biMap(x => x * 2, e => `${e}!`)(error('oops'));
  expect(isError(errMapped)).toBe(true);
  expect(errMapped.error).toBe('oops!');
});

test('fold returns correct value for ok', () => {
  const result = fold(x => `yes ${x}`, e => `no ${e}`)(ok('success'));
  expect(result).toBe('yes success');
});

test('fold returns correct value for error', () => {
  const result = fold(x => `yes ${x}`, e => `no ${e}`)(error('fail'));
  expect(result).toBe('no fail');
});

test('getOrElse returns value for ok', () => {
  const value = getOrElse(99)(ok(7));
  expect(value).toBe(7);
});

test('getOrElse returns default for error', () => {
  const value = getOrElse(99)(error('fail'));
  expect(value).toBe(99);
});

test('iter executes callback for ok', () => {
  let v = 0;
  iter((x: number) => v = x)(ok(5));
  expect(v).toBe(5);
});

test('iter skips callback for error', () => {
  let v = 0;
  iter((x: number) => v = x)(error('fail'));
  expect(v).toBe(0);
});

test('biIter calls correct function', () => {
  const okFn = vi.fn();
  const errFn = vi.fn();

  biIter(okFn, errFn)(ok('good'));
  expect(okFn).toHaveBeenCalledWith('good');
  expect(errFn).not.toHaveBeenCalled();

  biIter(okFn, errFn)(error('bad'));
  expect(errFn).toHaveBeenCalledWith('bad');
});

test('filter keeps ok if predicate true', () => {
  const r = filter((x: number) => x > 0)(ok(2));
  expect(isOk(r)).toBe(true);
});

test('filter converts to error if predicate fails', () => {
  const r = filter((x: number) => x > 10)(ok(2));
  expect(isError(r)).toBe(true);
  expect(r.error).toBe('Failed filter condition');
});

test('filter passes error through unchanged', () => {
  const r = filter((x: number) => x > 0)(error('fail'));
  expect(isError(r)).toBe(true);
  expect(r.error).toBe('Failed filter condition');
});

test('tap runs for ok and returns same result', () => {
  let v = 0;
  const r = tap(x => v = x)(ok(42));
  expect(v).toBe(42);
  expect(isOk(r)).toBe(true);
});

test('tap does nothing for error', () => {
  let called = false;
  const r = tap(() => called = true)(error('oops'));
  expect(called).toBe(false);
  expect(isError(r)).toBe(true);
});

test('compact filters ok values only', () => {
  const results = [ok(1), error('fail'), ok(3), error('x')];
  expect(compact(results)).toEqual([1, 3]);
});
