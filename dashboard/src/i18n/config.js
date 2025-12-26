// Import Dependencies
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Local Imports
import { defaultTheme } from "../configs/theme.config";

// ----------------------------------------------------------------------

// Initialize i18n with basic configuration first
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
    },
    fallbackLng: defaultTheme.fallbackLang,
    lng: localStorage.getItem("i18nextLng") || defaultTheme.defaultLang,
    supportedLngs: ["en", "es", "ar", "zh-cn", "vi"],
    ns: ["translations"],
    defaultNS: "translations",
    interpolation: {
      escapeValue: false,
    },
    lowerCaseLng: true,
    debug: false,
  });

i18n.languages = ["en", "es", "ar", "zh-cn", "vi"];

export default i18n
