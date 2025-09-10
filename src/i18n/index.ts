import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';

// Define supported languages
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' }
];

// Resources object with all translations
const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  ja: { translation: ja },
  ko: { translation: ko },
  zh: { translation: zh }
};

// Language detection options
const detectionOptions = {
  // Order of detection methods
  order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
  
  // Keys to lookup language from
  lookupLocalStorage: 'sasgo-language',
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,
  
  // Cache user language
  caches: ['localStorage'],
  
  // Check all fallback languages
  checkWhitelist: true
};

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    
    // Default language
    fallbackLng: 'en',
    
    // Allowed languages
    supportedLngs: supportedLanguages.map(lang => lang.code),
    
    // Language detection
    detection: detectionOptions,
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
      format: (value, format, lng) => {
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: getCurrencyForLanguage(lng || 'en')
          }).format(value);
        }
        
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }).format(new Date(value));
        }
        
        if (format === 'dateShort') {
          return new Intl.DateTimeFormat(lng, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }).format(new Date(value));
        }
        
        if (format === 'dateTime') {
          return new Intl.DateTimeFormat(lng, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(value));
        }
        
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value);
        }
        
        if (format === 'percent') {
          return new Intl.NumberFormat(lng, {
            style: 'percent',
            maximumFractionDigits: 1
          }).format(value / 100);
        }
        
        return value;
      }
    },
    
    // React options
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span']
    },
    
    // Debugging (disable in production)
    debug: process.env.NODE_ENV === 'development',
    
    // Missing key behavior
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation: ${lng}.${ns}.${key}`);
      }
    },
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Loading behavior
    load: 'languageOnly', // Don't load country-specific variants
    preload: ['en'], // Preload English as fallback
    
    // Namespace configuration
    defaultNS: 'translation',
    fallbackNS: 'translation'
  });

// Helper functions
function getCurrencyForLanguage(language: string): string {
  const currencyMap: { [key: string]: string } = {
    'en': 'USD',
    'es': 'EUR',
    'fr': 'EUR',
    'de': 'EUR',
    'it': 'EUR',
    'pt': 'EUR',
    'ja': 'JPY',
    'ko': 'KRW',
    'zh': 'CNY'
  };
  
  return currencyMap[language] || 'USD';
}

// Utility functions for components
export function getLanguageDirection(languageCode: string): 'ltr' | 'rtl' {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(languageCode) ? 'rtl' : 'ltr';
}

export function getLanguageByCode(code: string) {
  return supportedLanguages.find(lang => lang.code === code);
}

export function getCurrentLanguage() {
  return getLanguageByCode(i18n.language) || supportedLanguages[0];
}

export function changeLanguage(languageCode: string) {
  return i18n.changeLanguage(languageCode);
}

export function formatCurrency(amount: number, currency?: string, locale?: string) {
  const currentLocale = locale || i18n.language;
  const currentCurrency = currency || getCurrencyForLanguage(currentLocale);
  
  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency: currentCurrency
  }).format(amount);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions, locale?: string) {
  const currentLocale = locale || i18n.language;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(currentLocale, { ...defaultOptions, ...options }).format(dateObj);
}

export function formatRelativeTime(date: Date | string, locale?: string) {
  const currentLocale = locale || i18n.language;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Use Intl.RelativeTimeFormat if available
  if (Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  }
  
  // Fallback for browsers without RelativeTimeFormat
  if (diffInSeconds < 60) {
    return i18n.t('common.time.justNow');
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return i18n.t('common.time.minutesAgo', { count: minutes });
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return i18n.t('common.time.hoursAgo', { count: hours });
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return i18n.t('common.time.daysAgo', { count: days });
  }
}

export function formatNumber(number: number, locale?: string) {
  const currentLocale = locale || i18n.language;
  return new Intl.NumberFormat(currentLocale).format(number);
}

export function formatDistance(distance: number, unit: 'km' | 'mi' = 'km', locale?: string) {
  const currentLocale = locale || i18n.language;
  const formattedNumber = new Intl.NumberFormat(currentLocale, {
    maximumFractionDigits: 1
  }).format(distance);
  
  return `${formattedNumber} ${i18n.t(`common.units.${unit}`)}`;
}

// Export the configured i18n instance
export default i18n;