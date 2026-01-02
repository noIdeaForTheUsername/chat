import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

type SupportedLang = 'en' | 'pl';

const STORAGE_KEY = 'app_language';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {

  private translate = inject(TranslateService);
  private current: SupportedLang;

  constructor() {
    const initial = this.getInitialLanguage();
    this.current = initial;
    this.applyLanguage(initial);
  }

  getCurrent(): SupportedLang {
    return this.current;
  }

  setLanguage(lang: SupportedLang): void {
    if (this.current === lang) return;
    this.current = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
    this.applyLanguage(lang);
  }

  toggleLanguage(): void {
    const next: SupportedLang = this.current === 'en' ? 'pl' : 'en';
    this.setLanguage(next);
  }

  private applyLanguage(lang: SupportedLang): void {
    this.translate.use(lang);
    document.documentElement.lang = lang; 
  }

  private getInitialLanguage(): SupportedLang {
    if (typeof window === 'undefined') {
      return 'en';
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY) as SupportedLang | null;
      if (stored === 'en' || stored === 'pl') {
        return stored;
      }
    } catch {
      // ignore storage errors
    }

    const browserLang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    const normalized = browserLang.toLowerCase();

    if (normalized.startsWith('pl')) {
      return 'pl';
    }

    return 'en';
  }
}
