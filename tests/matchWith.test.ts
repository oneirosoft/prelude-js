import { expect, test } from 'bun:test';
import { matchWith, matchWithGuard } from '../src';

type Animal =
  | { type: 'dog'; name: string }
  | { type: 'cat'; color: string }
  | { type: 'parrot'; words: number };

test('matchWithGuard returns result from matched case', () => {
  const getSound = matchWithGuard(
    (animal: Animal) => animal.type,
    {
      dog: () => 'woof',
      cat: () => 'meow',
    }
  );

  expect(getSound({ type: 'dog', name: 'Fido' })).toBe('woof');
  expect(getSound({ type: 'cat', color: 'black' })).toBe('meow');
});

test('matchWithGuard uses correct narrowed type in handler', () => {
  const getDescription = matchWithGuard(
    (animal: Animal) => animal.type,
    {
      parrot: a => `Knows ${a.words} words`,
    },
    () => 'unknown animal'
  );

  expect(getDescription({ type: 'parrot', words: 42 })).toBe('Knows 42 words');
});

test('matchWithGuard uses fallback when no match is found', () => {
  const fallbackTest = matchWithGuard(
    (animal: Animal) => animal.type,
    {},
    () => 'fallback!'
  );

  expect(fallbackTest({ type: 'dog', name: 'Buddy' })).toBe('fallback!');
});

test('matchWithGuard throws if no case or fallback matches', () => {
  const unsafeMatch = matchWithGuard(
    (animal: Animal) => animal.type,
    {}
  );

  expect(() => unsafeMatch({ type: 'cat', color: 'white' })).toThrow('No match found for discriminant: cat');
});

test('matchWithGuard supports symbol and number discriminants', () => {
  type Event =
    | { kind: 0; payload: string }
    | { kind: 1; payload: number }
    | { kind: 2; payload: boolean };

  const handleEvent = matchWithGuard(
    ((event: Event) => event.kind) as (value: Record<"kind" | "payload", string | number | symbol>) => string | number | symbol,
    {
      0: (e: { kind: 0; payload: string }) => `string: ${e.payload}`,
      1: (e: { kind: 1; payload: number }) => `number: ${e.payload}`,
    },
    e => `other: ${String(e.payload)}`
  ) as ((value: Event) => string);

  expect(handleEvent({ kind: 0, payload: 'hi' })).toBe('string: hi');
  expect(handleEvent({ kind: 1, payload: 42 })).toBe('number: 42');
  expect(handleEvent({ kind: 2, payload: true })).toBe('other: true');
});

// matchWith tests
test('matchWith returns matched direct value', () => {
    const matcher = matchWith([
        ['x', 'foo'],
        ['y', 'bar']
    ]);
    expect(matcher('x')).toBe('foo');
});

test('matchWith returns matched function result', () => {
    const matcher = matchWith([
        ['z', v => v.toUpperCase()]
    ]);
    expect(matcher('z')).toBe('Z');
});

test('matchWith returns fallback value when unmatched', () => {
    const matcher = matchWith([
        ['a', 1]
    ], 0);
    expect(matcher('b')).toBe(0);
});

test('matchWith returns fallback function result when unmatched', () => {
    const matcher = matchWith([], v => `unknown: ${v}`);
    expect(matcher('foo')).toBe('unknown: foo');
});

test('matchWith throws when no match and no fallback', () => {
    const matcher = matchWith([
        ['a', 1]
    ]);
    expect(() => matcher('b')).toThrow('No match found for value: b');
});

test('matchWith supports multiple types in cases', () => {
    const matcher = matchWith<any, string>([
        [1, 'one'],
        ['two', '2'],
        [true, 'yes']
    ], 'unknown');

    expect(matcher(1)).toBe('one');
    expect(matcher('two')).toBe('2');
    expect(matcher(true)).toBe('yes');
    expect(matcher(false)).toBe('unknown');
});