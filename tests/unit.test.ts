import { test, expect } from 'bun:test';
import { unit, toUnitFn, toUnit } from '../src/unit';

test('unit is a frozen empty object', () => {
  expect(typeof unit).toBe('object');
  expect(unit).toEqual({});
  expect(Object.isFrozen(unit)).toBe(true);
});

test('toUnit returns the unit value regardless of input', () => {
  expect(toUnit(123)).toBe(unit);
  expect(toUnit(null)).toBe(unit);
  expect(toUnit(undefined)).toBe(unit);
  expect(toUnit('anything')).toBe(unit);
  expect(toUnit({})).toBe(unit);
});

test('toUnitFn calls the inner function and returns unit', () => {
  let called = false;
  const effect = () => { called = true };
  const wrapped = toUnitFn(effect);

  const result = wrapped();

  expect(called).toBe(true);
  expect(result).toBe(unit);
});

test('toUnitFn ignores return value of original function', () => {
  const fn = () => 'something';
  const wrapped = toUnitFn(fn);
  expect(wrapped()).toBe(unit);
});