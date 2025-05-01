import { test, expect } from 'bun:test';
import { compose } from '../src/compose';

const double = (x: number) => x * 2;
const toString = (x: number) => `Value: ${x}`;
const exclaim = (x: string) => `${x}!`;

test('compose applies functions right-to-left', () => {
    const result = compose(exclaim, toString, double)(5);
    expect(result).toBe('Value: 10!');
});

test('compose with one function returns function result', () => {
    const result = compose(double)(4);
    expect(result).toBe(8);
});

test('compose works with different types', () => {
    const result = compose(
        (len: number) => len * 2,
        (s: string) => s.length,
        (x: number) => x.toString()
    )(1234);
    expect(result).toBe(8);
});

test('compose handles identity chain', () => {
    const id = (x: boolean) => x;
    const result = compose(id, id, id)(true);
    expect(result).toBe(true);
});