
# Prelude.js

A small, dependency-free **functional programming** library for JavaScript & TypeScript, featuring:

- **Lazy**, **immutable**, **memoized** sequences (`Seq`)  
- Total, safe **Option** and **Safe** (Result) monads  
- A suite of utility functions: `pipe`, `compose`, `cond`, `once`, `memoize` and more  
- Excellent TypeScript typings and `bun:test`–friendly  

---

## Installation

```sh
# npm
npm install @oneiro/prelude-js

# bun
bun add @oneiro/prelude-js
```

---

## Quick Start

```ts
import {
  pipe, compose, cond, once,
  some, none, unwrap,
  attempt, match as matchSafe,
  Seq
} from '@oneiro/prelude-js'

// pipe & compose
const transform = pipe(
  Math.sqrt,
  x => x + 1,
  String
)
console.log(transform(16)) // "5"

const greet = compose(
  (s: string) => `HELLO, ${s}!`,
  (n: number) => `user#${n}`
)
console.log(greet(42)) // "HELLO, user#42!"

// once
let initCount = 0
const init = once(() => ++initCount)
init() // 1
init() // still 1

// cond
const classify = cond(
  [(x: number) => x === 0, () => 'zero'],
  [(x: number) => x > 0, x => `+${x}`]
)
console.log(unwrap(classify(0)))   // "zero"
console.log(unwrap(classify(5)))   // "+5"
console.log(classify(-1) === none) // true
```

---

## Option Monad

Safe handling of nullable values (`null`/`undefined`):

```ts
import { some, none, optional, isNone, unwrap } from '@oneiro/prelude-js/monads/option'

const o1 = some(42)
const o2 = optional(null)

console.log(isNone(o2))      // true
console.log(unwrap(o1))      // 42
// unwrap(none) throws!
```

- `some(value)` – must be non-nil, else throws  
- `none` – singleton  
- `optional(x)` – converts nullable ⇒ `Option`  
- Utilities: `map`, `flatMap`, `fold`, `getOrElse`, `iter`, `tap`, `compact`, `flatten`, …

---

## Safe / Result Monad

Wrap exceptions & control flow:

```ts
import Safe from '@oneiro/prelude-js/monads/safe'

const result = Safe.attempt(() => JSON.parse('{"x":1}'))
// Success { value: { x:1 } }
Safe.match(
  v => console.log('ok', v),
  e => console.error('err', e.cause)
)(result)
```

- `Safe.attempt(fn)` – returns `SUCCESS` or `FAILURE`  
- Utilities: `map`, `flatMap`, `fold`/`match`, `unwrapOr`, `recover`, `tap`, `compact`, `toEither`, `toOption`, …

---

## Seq: Lazy, Memoized Sequences

`Seq` is a **lazy**, **immutable**, **memoized** iterable abstraction.  
Once you pull an element, it’s cached for all derived sequences—without re-computing!

### Creating

```ts
import Seq from '@oneiro/prelude-js/seq'

// fromArray
const s1 = Seq.fromArray([1,2,3])

// range, unfold
const naturals = Seq.range(0, Infinity)    // infinite 0,1,2,...
const fibs     = Seq.fib                  // lazy Fibonacci
```

### Common Operations

```ts
// map / filter / flatMap
const evens = s1.filter(x => x % 2 === 0)    // [2]
const pairs = s1.zip(Seq.fromArray(['a','b','c']))
// [ [1,'a'], [2,'b'], [3,'c'] ]

// take / drop / slice
console.log([... naturals.take(5)])         // [0,1,2,3,4]
console.log([... naturals.drop(5).take(3)]) // [5,6,7]

// reduce / some / every / find
const sum = s1.reduce((acc,x) => acc+x, 0)   // 6

// groupBy / partition / distinct / scan / last / reverse / toArray
const grouped = Seq.fromArray(['a','ab','b','bc'])
                 .groupBy(s => s[0])        // Map { 'a'→Seq['a','ab'], 'b'→Seq['b','bc'] }

// chunk / chunkBy / window / intersperse / sliceBy
const chunks   = Seq.fromArray([1,2,3,4,5]).chunk(2)
// Seq<[1,2], [3,4], [5]>
```

### Safety & Limits

- `length(max?)` returns a `Safe<number>` failure if over limit.  
- `reverse(max?)` similarly guarded.  
- `toArray(max?)` – safe conversion.

---

## Other Utilities

- **`pipe`** / **`compose`** – function combinators  
- **`cond`** / **`condOr`** – guarded branching  
- **`when`** / **`unless`** / **`tap`** / **`memoize`** / **`onceAsync`**  
- **`prop`** / **`propOr`** / **`select`** / **`selectOr`** / **`selectSafe`**  
- **`oneOf`**, **`equalsAll`**, **`isNil`**, **`isNotNil`**, **`isObject`**, **`isFunction`**  
- **`eq`**, **`and`**, **`or`**, **`xor`**, **`nand`**, **`nor`**, **`iff`**, **`implies`**, …

---

## TypeScript Support

All functions are fully generic and typed, letting the compiler infer:

- Pipeline types in `pipe`/`compose`  
- Narrowed discriminants in `matchWithGuard`  
- Sequence element types  
- Monad type-guards & exhaustiveness  

---

## Contributing

1. Clone & `bun install`  
2. Edit, add tests under `tests/`  
3. Run `bun test` & `bun coverage`  
4. Submit PR!  

---

## License

MIT © Mark Pro

