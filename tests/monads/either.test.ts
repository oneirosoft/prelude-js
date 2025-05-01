import { test, expect } from 'bun:test';
import { Either } from '../../src';

test('Either.creates Left and Right correctly', () => {
  const l = Either.left('error');
  const r = Either.right(42);

  expect(Either.isLeft(l)).toBe(true);
  expect(Either.isRight(r)).toBe(true);
  expect(Either.isLeft(r)).toBe(false);
  expect(Either.isRight(l)).toBe(false);

  expect(l.value).toBe('error');
  expect(r.value).toBe(42);
});

test('Either.map only affects Right', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  const mappedLeft = Either.map((x: number) => x * 2)(l);
  const mappedRight = Either.map((x: number) => x * 2)(r);

  expect(Either.isLeft(mappedLeft)).toBe(true);
  expect(mappedLeft.value).toBe('fail');

  expect(Either.isRight(mappedRight)).toBe(true);
  expect(mappedRight.value).toBe(20);
});

test('Either.mapLeft only affects Left', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  const mappedLeft = Either.mapLeft((x: string) => x + '!')(l);
  const mappedRight = Either.mapLeft((x: string) => x + '!')(r);

  expect(Either.isLeft(mappedLeft)).toBe(true);
  expect(mappedLeft.value).toBe('fail!');

  expect(Either.isRight(mappedRight)).toBe(true);
  expect(mappedRight.value).toBe(10);
});

test('Either.biMap transforms both sides', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  const bimappedLeft = Either.biMap(
    (l: string) => `Error: ${l}`,
    (r: number) => r * 2
  )(l);

  const bimappedRight = Either.biMap(
    (l: string) => `Error: ${l}`,
    (r: number) => r * 2
  )(r);

  expect(Either.isLeft(bimappedLeft)).toBe(true);
  expect(bimappedLeft.value).toBe('Error: fail');

  expect(Either.isRight(bimappedRight)).toBe(true);
  expect(bimappedRight.value).toBe(20);
});

test('Either.flatMap only affects Right', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  const flatMappedLeft = Either.flatMap((x: number) => Either.right(x * 2))(l);
  const flatMappedRight = Either.flatMap((x: number) => Either.right(x * 2))(r);

  expect(Either.isLeft(flatMappedLeft)).toBe(true);
  expect(flatMappedLeft.value).toBe('fail');

  expect(Either.isRight(flatMappedRight)).toBe(true);
  expect(flatMappedRight.value).toBe(20);
});

test('Either.flatMapLeft only affects Left', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  const flatMappedLeft = Either.flatMapLeft((x: string) => Either.left(x + '!'))(l);
  const flatMappedRight = Either.flatMapLeft((x: string) => Either.left(x + '!'))(r);

  expect(Either.isLeft(flatMappedLeft)).toBe(true);
  expect(flatMappedLeft.value).toBe('fail!');

  expect(Either.isRight(flatMappedRight)).toBe(true);
  expect(flatMappedRight.value).toBe(10);
});

test('Either.fold returns correct result', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  const foldedLeft = Either.fold(
    (lval) => `Failure: ${lval}`,
    (rval) => `Success: ${rval}`
  )(l);

  const foldedRight = Either.fold(
    (lval) => `Failure: ${lval}`,
    (rval) => `Success: ${rval}`
  )(r);

  expect(foldedLeft).toBe('Failure: fail');
  expect(foldedRight).toBe('Success: 10');
});

test('Either.match behaves same as fold', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  const matchedLeft = Either.match(
    (lval) => `Failure: ${lval}`,
    (rval) => `Success: ${rval}`
  )(l);

  const matchedRight = Either.match(
    (lval) => `Failure: ${lval}`,
    (rval) => `Success: ${rval}`
  )(r);

  expect(matchedLeft).toBe('Failure: fail');
  expect(matchedRight).toBe('Success: 10');
});

test('Either.unwrap returns Right value or throws on Left', () => {
  const r = Either.right(123);
  const l = Either.left('fail');

  expect(Either.unwrap(r)).toBe(123);
  expect(() => Either.unwrap(l)).toThrow('Cannot unwrap Left value: fail');
});

test('Either.unwrapLeft returns Left value or throws on Right', () => {
  const l = Either.left('fail');
  const r = Either.right(999);

  expect(Either.unwrapLeft(l)).toBe('fail');
  expect(() => Either.unwrapLeft(r)).toThrow('Cannot unwrap Right value: 999');
});

test('Either.unwrapOrElse returns default for Left', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  const leftValue = Either.unwrapOrElse(0)(l);
  const rightValue = Either.unwrapOrElse(0)(r);

  expect(leftValue).toBe(0);
  expect(rightValue).toBe(10);
});

test('Either.unwrapLeftOrElse returns default for Right', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  const leftValue = Either.unwrapLeftOrElse('default')(l);
  const rightValue = Either.unwrapLeftOrElse('default')(r);

  expect(leftValue).toBe('fail');
  expect(rightValue).toBe('default');
});

test('Either.iter executes function for Right only', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  let result = 0;
  Either.iter((val: number) => { result = val * 2; })(r);
  expect(result).toBe(20);

  result = 0;
  Either.iter((val: number) => { result = val * 2; })(l);
  expect(result).toBe(0);
});

test('Either.iterLeft executes function for Left only', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  let result = '';
  Either.iterLeft((val: string) => { result = val + '!'; })(l);
  expect(result).toBe('fail!');

  result = '';
  Either.iterLeft((val: string) => { result = val + '!'; })(r);
  expect(result).toBe('');
});

test('Either.ifLeft triggers on Left', () => {
  const l = Either.left('fail');
  let called = false;

  Either.ifLeft(() => { called = true; })(l);

  expect(called).toBe(true);
});

test('Either.ifRight triggers on Right', () => {
  const r = Either.right('success');
  let called = false;

  Either.ifRight(() => { called = true; })(r);

  expect(called).toBe(true);
});

test('Either.swap exchanges Left and Right', () => {
  const l = Either.left('fail');
  const r = Either.right(10);

  const swappedLeft = Either.swap(l);
  const swappedRight = Either.swap(r);

  expect(Either.isRight(swappedLeft)).toBe(true);
  expect(swappedLeft.value).toBe('fail');

  expect(Either.isLeft(swappedRight)).toBe(true);
  expect(swappedRight.value).toBe(10);
});