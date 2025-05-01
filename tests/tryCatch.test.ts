import { test, expect } from "bun:test";
import { tryCatch, tryCatchAsync } from "../src"; // Adjust path as needed

test("tryCatch returns result of fn when no error is thrown", () => {
  const result = tryCatch(() => 42, () => -1);
  expect(result).toBe(42);
});

test("tryCatch returns fallback result when fn throws", () => {
  const result = tryCatch(() => {
    throw new Error("fail");
  }, () => -1);
  expect(result).toBe(-1);
});

test("tryCatch passes the error to the fallback", () => {
  const result = tryCatch(() => {
    throw new Error("fail");
  }, (err) => {
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("fail");
    return 0;
  });
  expect(result).toBe(0);
});

test("tryCatch handles thrown non-Error values", () => {
  const result = tryCatch(() => {
    throw "fail"; // Not an Error instance
  }, (err) => {
    expect(typeof err).toBe("string");
    return "recovered";
  });
  expect(result).toBe("recovered");
});

test("tryCatch works with complex return types", () => {
  const result = tryCatch(
    () => ({ success: true }),
    () => ({ success: false })
  );
  expect(result).toEqual({ success: true });
});

test("tryCatchAsync returns result when fn resolves", async () => {
  const result = await tryCatchAsync(async () => 42, async () => -1);
  expect(result).toBe(42);
});

test("tryCatchAsync calls onError when fn rejects", async () => {
  const result = await tryCatchAsync(
    async () => {
      throw new Error("fail");
    },
    async () => -1
  );
  expect(result).toBe(-1);
});

test("tryCatchAsync handles non-Error throw values", async () => {
  const result = await tryCatchAsync(
    async () => {
      throw "fail"; // Not an Error instance
    },
    async (err) => {
      expect(typeof err).toBe("string");
      return "recovered";
    }
  );
  expect(result).toBe("recovered");
});

test("tryCatchAsync supports sync fallback", async () => {
  const result = await tryCatchAsync(
    async () => {
      throw new Error("oops");
    },
    () => "sync fallback"
  );
  expect(result).toBe("sync fallback");
});

test("tryCatchAsync supports async fallback returning a promise", async () => {
  const result = await tryCatchAsync(
    async () => {
      throw new Error("error");
    },
    async (): Promise<string> => {
      return new Promise((resolve) => setTimeout(() => resolve("async fallback"), 10));
    }
  );
  expect(result).toBe("async fallback");
});