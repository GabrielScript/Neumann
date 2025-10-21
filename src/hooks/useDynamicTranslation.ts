import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from './useLanguage';

const translationCache = new Map<string, string>();

export const useDynamicTranslation = () => {
  const { language } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = useCallback(async (
    text: string,
    context?: string
  ): Promise<string> => {
    // Se já está no idioma correto, retorna
    if (language === 'pt' || !text) return text;
    
    // Verifica cache
    const cacheKey = `${text}-${language}-${context || 'default'}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    try {
      setIsTranslating(true);
      
      const { data, error } = await supabase.functions.invoke('translate-dynamic-content', {
        body: { text, targetLanguage: language, context }
      });

      if (error) {
        console.error('Translation error:', error);
        return text; // Fallback para o original
      }
      
      const translated = data.translatedText || text;
      translationCache.set(cacheKey, translated);
      
      return translated;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Fallback para o original
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  return { translate, isTranslating, language };
};
