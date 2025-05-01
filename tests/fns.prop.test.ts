import { test, expect } from "bun:test";
import { prop, propOr } from "../src"; // adjust path if needed

test("prop retrieves the value of a string key", () => {
    const getName = prop("name");
    const person = { name: "Alice", age: 30 };
    expect(getName(person)).toBe("Alice");
});

test("prop retrieves the value of a numeric key", () => {
    const getFirst = prop(0);
    const arr = ["a", "b", "c"];
    expect(getFirst(arr)).toBe("a");
});

test("prop retrieves undefined for missing key", () => {
    const getTitle = prop("title" as "title");
    const book = { author: "Unknown" };
    expect(getTitle(book as any)).toBeUndefined();
});

test("prop works with union types", () => {
    type Shape = { kind: "circle"; radius: number } | { kind: "square"; size: number };
    const getKind = prop("kind");
    expect(getKind({ kind: "circle", radius: 10 })).toBe("circle");
    expect(getKind({ kind: "square", size: 5 })).toBe("square");
});

test("prop retains type inference", () => {
    const getLength = prop("length");
    const str = "hello";
    const len: number = getLength(str); // should infer number
    expect(len).toBe(5);
});

test("propOr returns the property value when defined", () => {
    const getAgeOrDefault = propOr("age", 18);
    const user = { name: "Alice", age: 30 };
    expect(getAgeOrDefault(user)).toBe(30);
});

test("propOr returns fallback when property is undefined", () => {
    const getAgeOrDefault = propOr("age", 18);
    const user = { name: "Bob" };
    expect(getAgeOrDefault(user as any)).toBe(18);
});

test("propOr returns fallback when property is null", () => {
    const getStatusOrDefault = propOr("status", "unknown");
    const record = { status: null };
    expect(getStatusOrDefault(record)).toBe("unknown");
});

test("propOr works with falsy values like 0 and ''", () => {
    const getCount = propOr("count", 100);
    expect(getCount({ count: 0 })).toBe(0);

    const getLabel = propOr("label", "default");
    expect(getLabel({ label: "" })).toBe("");
});

test("propOr works with union types", () => {
    type Input = { type: "admin"; level?: number } | { type: "user"; level?: number };
    const getLevelOrZero = propOr("level", 0);
    expect(getLevelOrZero({ type: "user" })).toBe(0);
    expect(getLevelOrZero({ type: "admin", level: 3 })).toBe(3);
});