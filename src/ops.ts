
/** 
 * Create a function that equates two values.
*/
export const eq = <T>(a: T) => (b: T): boolean => a === b;

/**
 * Create a function that returns the negation of its argument.
 */
export const not = (value: boolean): boolean => !value;

/**
 * Create a function that returns the logical AND of its arguments.
 */
export const and = <T>(a: T) => <U>(b: U): boolean => Boolean(a && b);

/**
 * Create a function that returns the logical OR of its arguments.
 */
export const or = <T>(a: T) => <U>(b: U): boolean => Boolean(a || b);

/**
 * Create a function that returns the logical XOR of its arguments.
 */
export const xor = <T>(a: T) => <U>(b: U): boolean => Boolean(a) !== Boolean(b);

/**
 * Create a function that returns the logical NAND of its arguments.
 */
export const nand = <T>(a: T) => <U>(b: U): boolean => !(a && b);

/**
 * Create a function that returns the logical NOR of its arguments.
 */
export const nor = <T>(a: T) => <U>(b: U): boolean => !(a || b);

/**
 * Create a function that returns the logical XNOR of its arguments.
 */
export const xnor = <T>(a: T) => <U>(b: U): boolean => !(Boolean(a) !== Boolean(b));

/**
 * Create a function that returns the logical implication of its arguments.
 */
export const implies = <T>(a: T) => <U>(b: U): boolean => !a || Boolean(b);

/**
 * Create a function that returns the logical equivalence of its arguments.
 */
export const iff = <T>(a: T) => <U>(b: U): boolean => Boolean(a) === Boolean(b);