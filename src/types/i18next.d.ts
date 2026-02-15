// Type definitions for i18next translations
// This file provides type safety for translation keys

import "i18next";

// Override i18next types to allow any translation key
// This is a workaround for i18next's strict typing
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: {
        [key: string]: string | { [key: string]: string };
      };
    };
  }

  // Override the TFunction type to be more permissive
  interface TFunction {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (key: string | string[], options?: any): string;
  }
}
