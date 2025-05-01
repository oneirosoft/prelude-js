import { test, expect, vi } from 'bun:test';
import { unless, when, whenDo } from '../src';

test('when applies transformation when predicate is true', () => {
    const doubleIfEven = when((n: number) => n % 2 === 0, n => n * 2);

    expect(doubleIfEven(4)).toBe(8);  // Predicate is true
    expect(doubleIfEven(3)).toBe(3);  // Predicate is false
});

test('when does not alter value when predicate is false', () => {
    const negateIfNegative = when((n: number) => n < 0, n => -n);

    expect(negateIfNegative(-5)).toBe(5);  // Predicate is true
    expect(negateIfNegative(10)).toBe(10); // Predicate is false
});

test('whenDo runs side effect when predicate is true', () => {
    const spy = vi.fn();
    const logIfEven = whenDo((n: number) => n % 2 === 0, spy);

    logIfEven(4); // Should trigger effect
    logIfEven(3); // Should not trigger effect

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(4);
});

test('whenDo does not run effect when predicate is false', () => {
    const spy = vi.fn();
    const onlyIfString = whenDo((v: unknown) => typeof v === 'string', spy);

    onlyIfString(42);    // Should not trigger
    onlyIfString('yes'); // Should trigger

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('yes');
});

test('unless applies function when predicate is false', () => {
    const ensureEven = unless((n: number) => n % 2 === 0, n => n + 1);
    expect(ensureEven(3)).toBe(4);  // predicate false → transform
    expect(ensureEven(4)).toBe(4);  // predicate true  → no change
  });
  
  test('unless returns value unchanged when predicate is true', () => {
    interface User {
      isAdmin: boolean;
      role?: string;
    }

    const capUnlessAdmin = unless(
      (user: User) => user.isAdmin,
      user => ({ ...user, role: 'guest' })
    );
  
    const admin = { isAdmin: true };
    const guest = { isAdmin: false };
  
    expect(capUnlessAdmin(admin)).toEqual(admin);
    expect(capUnlessAdmin(guest)).toEqual({ isAdmin: false, role: 'guest' });
  });