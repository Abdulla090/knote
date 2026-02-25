import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en/translation.json';
import ku from './ku/translation.json';

i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources: {
        en: { translation: en },
        ku: { translation: ku },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
    },
});

export default i18n;
