import { test, expect } from 'bun:test';
import { pipe } from '../src/pipe';

const double = (x: number) => x * 2;
const toString = (x: number) => `Value: ${x}`;
const exclaim = (x: string) => `${x}!`;

test('pipe applies functions left-to-right', () => {
    const result = pipe(5, double, toString, exclaim);
    expect(result).toBe('Value: 10!');
});

test('pipe with single function returns correct result', () => {
    const result = pipe(3, double);
    expect(result).toBe(6);
});

test('pipe works with different types', () => {
    const result = pipe(
        10,
        (x: number) => x.toString(),
        (s: string) => s.length,
        (len: number) => len * 2
    );
    expect(result).toBe(4);
});

test('pipe handles no-op chain', () => {
    const id = <T>(x: T) => x;
    const result = pipe(42, id, id, id);
    expect(result).toBe(42);
});