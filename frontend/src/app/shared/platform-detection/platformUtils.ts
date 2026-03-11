
export function isIOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

export function isPwa() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true
}

export function isAndroid() {
  const ua = navigator.userAgent || navigator.vendor;
  return /android/i.test(ua);
}

// This is supposed to detect devices that only support touch input. For example, a laptop with a touchscreen should not be detected as a
// touch-only device, because it has a keyboard and mouse as well, so the user should be able to use all features of the app without any issues.
export function isTouchOnlyDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}