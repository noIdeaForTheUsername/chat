import { Transform } from "class-transformer";

export function emptyToNull(value: any) {
  if (value) return value;  // anything that gives "true" remains unchanged

  if (value === false) return false;  // proper "false" value remains false
  if (value === undefined) return undefined;  // undefined remains undefined
  if (value === 0) return 0;  // proper "0" value remains 0

  return null;  // anything else that gives "false" becomes null
}

export function EmptyToNull() {
  return Transform(({ value }) => {
    return emptyToNull(value);
  });
}