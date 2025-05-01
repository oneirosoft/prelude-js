import { test, expect } from 'bun:test';
import { Thunk } from '../src'

test('Thunk.force evaluates the thunk', () => {
  const thunk = () => 42;
  expect(Thunk.force(thunk)).toBe(42);
});

test('Thunk.map transforms the result of the thunk', () => {
  const original = () => 10;
  const mapped = Thunk.map((x: number) => x * 2)(original);
  expect(Thunk.force(mapped)).toBe(20);
});

test('Thunk.iter executes a side effect', () => {
  const thunk = () => 'hello';
  let result = '';

  Thunk.iter((value) => {
    result = value + ' world';
  })(thunk);

  expect(result).toBe('hello world');
});

test('Thunk.map composes multiple transformations', () => {
  const base = () => 3;
  const double = Thunk.map((x: number) => x * 2);
  const square = Thunk.map((x: number) => x * x);

  const composed = square(double(base));
  expect(Thunk.force(composed)).toBe(36); // (3 * 2)^2 = 36
});