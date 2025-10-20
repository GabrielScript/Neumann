import { useState, useEffect } from 'react';

type Language = 'pt' | 'en';

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'pt' ? 'en' : 'pt');
  };

  const getLanguageName = () => {
    return language === 'pt' ? 'Português' : 'English';
  };

  return {
    language,
    setLanguage,
    toggleLanguage,
    getLanguageName,
  };
};
