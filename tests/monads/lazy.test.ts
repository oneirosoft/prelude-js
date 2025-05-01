import { test, expect } from 'bun:test';
import { Lazy } from '../../src'; // Adjust path as needed

test('Lazy.create evaluates only once', () => {
  let count = 0;
  const lz = Lazy.create(() => {
    count++;
    return 42;
  });

  expect(count).toBe(0);
  expect(lz.get()).toBe(42);
  expect(count).toBe(1);
  expect(lz.get()).toBe(42);
  expect(count).toBe(1); // still 1, memoized
});

test('Lazy.toString evaluates value and shows it', () => {
  const lz = Lazy.create(() => 99);
  const before = lz.toString(); // triggers get()
  expect(before).toBe('Lazy(99)');
  expect(lz.get()).toBe(99); // already evaluated
});

test('Lazy.map transforms value', () => {
  const lz = Lazy.create(() => 10);
  const mapped = Lazy.map((x: number) => x * 2)(lz);

  expect(mapped.get()).toBe(20);
});

test('Lazy.flatMap chains computations', () => {
  const lz = Lazy.create(() => 3);
  const chained = Lazy.flatMap((x: number) => Lazy.create(() => x + 7))(lz);

  expect(chained.get()).toBe(10);
});

test('Lazy.iter executes side-effect with value', () => {
  const lz = Lazy.create(() => 5);
  let result = 0;

  Lazy.iter((x) => { result = x * 3 })(lz);

  expect(result).toBe(15);
});

test('Lazy.unwrap extracts the value', () => {
  const lz = Lazy.create(() => 21);
  const value = Lazy.unwrap(lz);

  expect(value).toBe(21);
});

test('Lazy.tap executes side-effect and returns Lazy', () => {
  const lz = Lazy.create(() => 8);
  let result = 0;

  const tapped = Lazy.tap((x) => { result = x * 4 })(lz);

  expect(result).toBe(32);
  expect(tapped.get()).toBe(8);
});

test('Lazy.toJSON returns the value', () => {
  const lz = Lazy.create(() => 100);
  const jsonValue = lz.toJSON();

  expect(jsonValue).toBe(100);
});

test('Lazy JSON.stringify works', () => {
  const lz = Lazy.create(() => 200);
  const jsonString = JSON.stringify(lz);

  expect(jsonString).toBe('200');
});

test('Lazy.flatten flattens nested Lazy', () => {
  const nested = Lazy.create(() => Lazy.create(() => 42));
  const flattened = Lazy.flatten(nested);

  expect(flattened.get()).toBe(42);
});