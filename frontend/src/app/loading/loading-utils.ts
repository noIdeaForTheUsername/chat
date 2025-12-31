import { computed, Signal } from "@angular/core";

export function getComputedErrorCode(...multipleCodes: Signal<number | null>[]) {
  return computed(() => {
    for (let code of multipleCodes) {
      if (code() !== null) return code();
    }
    return null;
  });
}