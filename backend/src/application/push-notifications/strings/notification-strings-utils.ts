import { notificationStrings } from "./notification-strings";

export function getTranslatedString(language: 'pl' | 'en', key: string | string[]): string {
  const langStrings = notificationStrings[language] as any;
  let result = "";

  // single string
  if (typeof key === "string") {
    return langStrings[key] ?? key;
  }

  // array
  for (const entry of key) {
    const translated = langStrings[entry];
    result += translated ?? entry;
  }
  return result;
}

export function getNormalizedLang(language?: string | null): 'pl' | 'en' {
  return language?.toLowerCase().includes("pl") ? "pl" : "en";
}

export function getNotificationMessageString(rawMessage: string | string[], normalizedLang: 'pl' | 'en'): string {
  const normalizedMessage = Array.isArray(rawMessage) ? rawMessage : [rawMessage];
  return getTranslatedString(normalizedLang, [...normalizedMessage]);
}
