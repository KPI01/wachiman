import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function useResolvedValue<T>(
  value: T | PromiseLike<T>,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [resolvedValue, setResolvedValue] = useState<T>(() =>
    isPromiseLike(value) ? fallback : value,
  );
  const [isResolved, setIsResolved] = useState(() => !isPromiseLike(value));

  useEffect(() => {
    if (!isPromiseLike(value)) {
      setResolvedValue(value);
      setIsResolved(true);
      return;
    }

    let active = true;
    Promise.resolve(value).then(
      (result) => {
        if (active) {
          setResolvedValue(result);
          setIsResolved(true);
        }
      },
      () => {
        // Keep the latest usable value when a deferred refresh fails.
      },
    );

    return () => {
      active = false;
    };
  }, [value]);

  return [resolvedValue, setResolvedValue, isResolved];
}

function isPromiseLike<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
  return typeof value === "object" && value !== null && "then" in value && typeof value.then === "function";
}
