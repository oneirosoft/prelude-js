import { test, expect } from 'bun:test';
import { eq, not, and, or, xor, nand, nor, xnor, implies, iff } from '../src/ops';

test('eq returns true if values are strictly equal', () => {
  expect(eq(1)(1)).toBe(true);
  expect(eq('a')('a')).toBe(true);
  expect(eq(true)(true)).toBe(true);
  expect(eq(null)(null)).toBe(true);
});

test('eq returns false for non-strictly equal values', () => {
  expect(eq(1)(2)).toBe(false);
  expect(eq('a')('b')).toBe(false);
  expect(eq(true)(false)).toBe(false);
  expect(eq(undefined)(null as any)).toBe(false);
});

test('not negates boolean values', () => {
  expect(not(true)).toBe(false);
  expect(not(false)).toBe(true);
});

test('and returns true only if both are truthy', () => {
  expect(and(true)(true)).toBe(true);
  expect(and(1)(true)).toBe(true);
  expect(and(true)(0)).toBe(false);
  expect(and(false)(true)).toBe(false);
});

test('or returns true if either value is truthy', () => {
  expect(or(true)(false)).toBe(true);
  expect(or(0)(1)).toBe(true);
  expect(or(false)(false)).toBe(false);
  expect(or(null)(undefined)).toBe(false);
});

test('xor returns true if only one value is truthy', () => {
  expect(xor(true)(false)).toBe(true);
  expect(xor(false)(true)).toBe(true);
  expect(xor(true)(true)).toBe(false);
  expect(xor(false)(false)).toBe(false);
});

test('nand returns true unless both are truthy', () => {
  expect(nand(true)(true)).toBe(false);
  expect(nand(true)(false)).toBe(true);
  expect(nand(false)(true)).toBe(true);
  expect(nand(false)(false)).toBe(true);
});

test('nor returns true only if both are falsy', () => {
  expect(nor(false)(false)).toBe(true);
  expect(nor(false)(true)).toBe(false);
  expect(nor(true)(false)).toBe(false);
  expect(nor(true)(true)).toBe(false);
});

test('xnor returns true if both are truthy or both falsy', () => {
  expect(xnor(true)(true)).toBe(true);
  expect(xnor(false)(false)).toBe(true);
  expect(xnor(true)(false)).toBe(false);
  expect(xnor(false)(true)).toBe(false);
});

test('implies returns false only if a is truthy and b is falsy', () => {
  expect(implies(true)(false)).toBe(false);
  expect(implies(false)(false)).toBe(true);
  expect(implies(false)(true)).toBe(true);
  expect(implies(true)(true)).toBe(true);
});

test('iff returns true if a and b have same truthiness', () => {
  expect(iff(true)(true)).toBe(true);
  expect(iff(false)(false)).toBe(true);
  expect(iff(true)(false)).toBe(false);
  expect(iff(false)(true)).toBe(false);
});

