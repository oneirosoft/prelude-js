export type Unit = typeof unit

export const unit = Object.freeze({});

export const toUnitFn = (fn: () => unknown): () => Unit =>
    () => {
      fn();
      return unit;
    }

export const toUnit = (_: unknown): Unit => unit;