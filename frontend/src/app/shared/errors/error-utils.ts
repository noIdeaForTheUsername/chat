import { inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";


export var httpCodeMap: Map<number, string> = new Map([
  [0, 'server-unavailable'],
  [400, 'data-invalid'],
  [401, 'unauthorized'],
  [403, 'unauthorized'],
  [404, 'not-found'],
  [500, 'server-error']
]);

export var extraErrorsMap: Map<string, string> = new Map([
  ["token-invalid", 'session-expired'],
]);


export function getErrorMessageKey(errorCode: number | string | null, translate: TranslateService): string {
  if (errorCode !== null) {

    // Numeric ID: try to map HTTP Code to error key
    let intId = typeof errorCode === 'number' ? errorCode : parseInt(errorCode);
    if (!isNaN(intId)) { 
      let mappedId = httpCodeMap.get(intId);
      errorCode = mappedId || "data-unavailable";  // HTTP codes fallback to "data-unavailable"
    }
    // String ID: try to map extra known error codes to error keys
    else if (typeof errorCode === 'string') {
      let mappedId = extraErrorsMap.get(errorCode);
      if (mappedId) errorCode = mappedId;
    }

    let key = `error.${errorCode}.header`;
    if (checkTranslationKeyExists(key, translate)) return `error.${errorCode}`;
  }
  return "error.unknown";
}

function checkTranslationKeyExists(key: string | null, translate: TranslateService): boolean {

  if (key === null) return false;
  let foundValue = translate.instant(key);
  return foundValue != key;
}