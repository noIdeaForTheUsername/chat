import { AbstractControl, ValidationErrors } from "@angular/forms";

export const REQUIRED_PASSWORD_LENGTH = 10;

// Usage requirements: Form must have 'password' and 'passwordRepeat' controls

export function passwordsValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value ?? '';
  const passwordRepeat = control.get('passwordRepeat')?.value ?? '';

  const strongPassword =
    password.length >= REQUIRED_PASSWORD_LENGTH
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /[\d\p{P}\p{S}]/u.test(password);

  const passwordsMatch = password.length > 0 && password === passwordRepeat;

  return strongPassword && passwordsMatch ? null : { passwordInvalid: true };
}

export function passwordsValidatorOptional(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value ?? '';
  const passwordRepeat = control.get('passwordRepeat')?.value ?? '';

  const strongPassword =
    /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /[\d\p{P}\p{S}]/u.test(password);

  const passwordsMatch = password === passwordRepeat;

  return ((password.length === 0 && passwordRepeat.length === 0)
    || (strongPassword && passwordsMatch)) ? null : { passwordInvalid: true };
}

export const phoneNumberRegex = /^\+(?=(?:[\s-]*\d){1,15}[\s-]*$)[1-9][\d\s-]*$/;