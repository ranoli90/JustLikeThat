import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

interface Locale {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  isDefault: boolean;
}

interface TranslationContextType {
  currentLocale: string;
  setLocale: (locale: string) => Promise<void>;
  availableLocales: Locale[];
  translations: Record<string, Record<string, string>>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
  direction: 'ltr' | 'rtl';
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

interface TranslationProviderProps {
  children: ReactNode;
  defaultLocale?: string;
  namespaces?: string[];
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  defaultLocale = 'en',
  namespaces = ['common', 'auth', 'validation', 'errors', 'buttons'],
}) => {
  const [currentLocale, setCurrentLocale] = useState<string>(defaultLocale);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load available locales on mount
  useEffect(() => {
    const loadLocales = async () => {
      try {
        const response = await fetch('/api/v1/i18n/locales');
        const locales: Locale[] = await response.json();
        setAvailableLocales(locales);
      } catch {
        console.error('Failed to load locales');
        // Fallback to default locales
        setAvailableLocales([
          { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', isDefault: true },
          { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', isDefault: false },
          { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', isDefault: false },
          { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', isDefault: false },
          { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', isDefault: false },
          { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', isDefault: false },
          { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', isDefault: false },
          { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', isDefault: false },
        ]);
      }
    };
    loadLocales();
  }, []);

  // Detect language from browser settings
  useEffect(() => {
    const detectLanguage = () => {
      const [browserLang] = navigator.language.split('-');
      const savedLocale = localStorage.getItem('locale');

      if (savedLocale && availableLocales.some((l: Locale) => l.code === savedLocale)) {
        setCurrentLocale(savedLocale);
      } else if (availableLocales.some((l: Locale) => l.code === browserLang)) {
        setCurrentLocale(browserLang);
      } else {
        const defaultLoc = availableLocales.find((l: Locale) => l.isDefault);
        if (defaultLoc) {
          setCurrentLocale(defaultLoc.code);
        }
      }
    };

    if (availableLocales.length > 0) {
      detectLanguage();
    }
  }, [availableLocales]);

  // Load translations when locale changes
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/i18n/translations/${currentLocale}?namespaces=${namespaces.join(',')}`);
        const data = await response.json();
        setTranslations(data);
      } catch {
        console.error('Failed to load translations');
        setTranslations({});
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
    document.documentElement.lang = currentLocale;
  }, [currentLocale, namespaces]);

  // Set RTL direction
  useEffect(() => {
    const locale = availableLocales.find((l: Locale) => l.code === currentLocale);
    if (locale) {
      document.documentElement.dir = locale.direction;
    }
  }, [currentLocale, availableLocales]);

  const handleSetLocale = useCallback(async (locale: string) => {
    setCurrentLocale(locale);
    localStorage.setItem('locale', locale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      // Split key by namespace (e.g., "auth.login.button")
      const parts = key.split('.');
      let translation: string | Record<string, string> = translations;

      for (const part of parts) {
        // Prevent prototype pollution
        if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
          return key;
        }
        if (translation && typeof translation === 'object' && part in translation) {
          translation = translation[part] as string | Record<string, string>;
        } else {
          return key; // Return key if translation not found
        }
      }

      if (typeof translation !== 'string') {
        return key;
      }

      // Replace parameters
      if (params) {
        let result = translation;
        for (const [param, value] of Object.entries(params)) {
          // Prevent prototype pollution through params
          if (param === '__proto__' || param === 'constructor' || param === 'prototype') {
            continue;
          }
          // Escape regex special characters in value
          const escapedValue = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          result = result.replace(new RegExp(`{{${param}}}`, 'g'), escapedValue);
        }
        return result;
      }

      return translation;
    },
    [translations]
  );

  const direction = useMemo((): 'ltr' | 'rtl' => {
    const locale = availableLocales.find((l: Locale) => l.code === currentLocale);
    return locale?.direction || 'ltr';
  }, [currentLocale, availableLocales]);

  const value = useMemo(
    (): TranslationContextType => ({
      currentLocale,
      setLocale: handleSetLocale,
      availableLocales,
      translations,
      t,
      isLoading,
      direction,
    }),
    [currentLocale, handleSetLocale, availableLocales, translations, t, isLoading, direction]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export default TranslationProvider;
