import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import i18n from '../i18n';

type Language = 'en' | 'es' | 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('super_admin_language') as Language;
    return stored || 'en';
  });

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem('super_admin_language', language);
  }, [language]);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const t = (key: string): string => {
    return i18n.t(key);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

