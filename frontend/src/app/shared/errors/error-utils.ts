import { inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";


export var httpCodeMap: Map<number, string> = new Map([
  [0, 'server-unavailable'],
  [504, 'server-unavailable'],  // Gateway Timeout (service worker)
  [400, 'data-invalid'],
  [401, 'unauthorized'],
  [404, 'not-found'],
  [500, 'server-error'] 
]);

export var extraErrorsMap: Map<string, string> = new Map([
  ["token-invalid", 'unauthorized'],
]);

export var errorIconMap: Map<string, string> = new Map([
  ['server-unavailable', 'alert-circle-outline'],
  ['server-error', 'flame'],
  ['no-internet', 'wifi-outline'],
  ['not-found', 'help'],
  ['bad-url', 'help'],
  ['data-invalid', 'help'],
  ['unauthorized', 'hand-left'],
  ['data-unavailable', 'alert-circle-outline'],
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

    // Try to map server-unavailable / no-internet based on online status
    errorCode = mapServerUnavailable(errorCode);

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

function mapServerUnavailable(errorCode: number | string | null) {
  if (errorCode === "server-unavailable" || errorCode === "no-internet" || errorCode === 0 || errorCode === 504) {
    if (window.navigator.onLine)
      return 'server-unavailable';
    else
      return 'no-internet';
  }
  else return errorCode;  
}