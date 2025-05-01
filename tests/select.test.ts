import {
  test,
  expect
} from 'bun:test'
import { select, selectOr, selectSafe } from '../src';

test('select applies transformation function', () => {
  const toUpper = select((s: string) => s.toUpperCase());
  expect(toUpper('hello')).toBe('HELLO');
});

test('select works with numbers', () => {
  const double = select((n: number) => n * 2);
  expect(double(3)).toBe(6);
});

test('select returns correct type', () => {
  const getLength = select((arr: number[]) => arr.length);
  expect(getLength([1, 2, 3])).toBe(3);
});

test('selectOr applies transformation when value is not nil', () => {
  const getLengthOrZero = selectOr(0, (s: string) => s.length);
  expect(getLengthOrZero('hello')).toBe(5);
});

test('selectOr returns fallback when value is null', () => {
  const getLengthOrZero = selectOr(0, (s: string) => s.length);
  expect(getLengthOrZero(null)).toBe(0);
});

test('selectOr returns fallback when value is undefined', () => {
  const getLengthOrZero = selectOr(0, (s: string) => s.length);
  expect(getLengthOrZero(undefined)).toBe(0);
});

test('selectOr returns correct type', () => {
  const squareOrOne = selectOr(1, (n: number) => n * n);
  expect(squareOrOne(4)).toBe(16);
  expect(squareOrOne(undefined)).toBe(1);
});

test('selectOr passes through undefined returned by transform', () => {
  const maybeUndefined = selectOr('fallback', () => undefined);
  expect(maybeUndefined('value')).toBeUndefined(); // explicitly returns undefined
});

test('selectOr returns a function', () => {
  const fn = selectOr(0, (x: number) => x * 2);
  expect(typeof fn).toBe('function');
});

test('selectSafe applies transformation if no error', () => {
  const safeParse = selectSafe((s: string) => JSON.parse(s), () => ({}));
  expect(safeParse('{"x":1}')).toEqual({ x: 1 });
});

test('selectSafe returns fallback if transformation throws', () => {
  const fallback = { error: true };
  const safeParse = selectSafe((s: string) => JSON.parse(s), () => fallback);
  expect(safeParse('bad json')).toBe(fallback);
});

test('selectSafe returns undefined if fallback returns undefined', () => {
  const safe = selectSafe(() => {
    throw new Error('fail');
  }, () => undefined);

  expect(safe('whatever')).toBe(undefined);
});

test('selectSafe passes the original error to onError', () => {
  const safe = selectSafe(
    (_: string) => {
      throw new Error('fail');
    },
    (e) => {
      expect((e as Error).message).toBe('fail');
      return 'fallback';
    }
  );
  expect(safe('')).toBe('fallback');
});

test('selectSafe works with numbers', () => {
  const safeSquare = selectSafe((n: number) => n * n, () => 0);
  expect(safeSquare(5)).toBe(25);
});

test('selectSafe allows transform to return void', () => {
  const log = selectSafe((_: string) => { /* returns void */ }, () => undefined);
  expect(log('x')).toBe(undefined);
});

test('selectSafe returns a function', () => {
  const fn = selectSafe((x: number) => x * 2, () => 0);
  expect(typeof fn).toBe('function');
});