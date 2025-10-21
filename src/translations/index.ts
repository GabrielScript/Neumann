import { useLanguage } from '@/hooks/useLanguage';
import pt from './pt.json';
import en from './en.json';

const translations = { pt, en };

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key: string, params?: Record<string, string>) => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (!value) return key;
    
    // Substituir parâmetros {name}
    if (params && typeof value === 'string') {
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(`{${k}}`, v),
        value
      );
    }
    
    return value;
  };
  
  return { t, language };
};
