import { Injectable } from '@nestjs/common';
import { notificationStrings } from './strings';
import { LoggingService } from 'src/shared/logging/app-logger';
import { StringTemplate as StringTemplate } from './string-template';

@Injectable()
export class StringsService {

  constructor(
    private logger: LoggingService,
  ) { }

  getFromKey(key: string, language: 'pl' | 'en'): string {
    language = this.getNormalizedLang(language);
    const langStrings = notificationStrings[language] as any;
    if (langStrings[key]) {
      return langStrings[key];
    } else {
      this.logger.error(`String key "${key}" not found"`);
      return key;
    }
  }


  /* Template contains:
  - string keys (consisting of letters) to be replaced with corresponding values
  - dollar signs ($) to be replaced with parameters
  - other characters that will be returned as is (e.g. punctuation, spaces)
  Example: "accountCreatedMessage: $", ["Alice"] -> "New account created: Alice"
  */
  getFromTemplate(stringTemplate: StringTemplate, language: 'pl' | 'en'): string {
    const { schema, params } = stringTemplate;
    let output = "" + schema;
    const stringKeyRegex = /[a-zA-Z]+/g;
    
    for (const match of output.matchAll(stringKeyRegex)) {
      const key = match[0];
      const value = this.getFromKey(key, language);
      output = output.replace(key, value);
    }
    for (const param of params ?? []) {
      output = output.replace("$", param.toString());
    }

    return output;
  }


  getNormalizedLang(language?: string | null): 'pl' | 'en' {
    return language?.toLowerCase().includes("pl") ? "pl" : "en";
  }
}
