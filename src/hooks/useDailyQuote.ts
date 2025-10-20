import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DailyQuote {
  id: string;
  quote: string;
  category: string;
}

export const useDailyQuote = () => {
  const { user } = useAuth();
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDailyQuote();
    }
  }, [user]);

  const fetchDailyQuote = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar todas as frases do banco
      const { data: allQuotes, error: quotesError } = await supabase
        .from('daily_quotes')
        .select('id, quote, category');

      if (quotesError) throw quotesError;
      if (!allQuotes || allQuotes.length === 0) {
        throw new Error('Nenhuma frase disponível');
      }

      // Buscar frases já vistas pelo usuário
      const { data: seenQuotes, error: seenError } = await supabase
        .from('user_daily_quotes')
        .select('quote_id')
        .eq('user_id', user?.id);

      if (seenError) throw seenError;

      const seenIds = new Set(seenQuotes?.map(sq => sq.quote_id) || []);

      // Filtrar frases não vistas
      let unseenQuotes = allQuotes.filter(q => !seenIds.has(q.id));

      // Se todas foram vistas, resetar e começar novo ciclo
      if (unseenQuotes.length === 0) {
        console.log('Todas as frases foram vistas, resetando...');
        
        // Deletar histórico de frases vistas
        const { error: deleteError } = await supabase
          .from('user_daily_quotes')
          .delete()
          .eq('user_id', user?.id);

        if (deleteError) throw deleteError;

        // Todas as frases estão disponíveis novamente
        unseenQuotes = allQuotes;
      }

      // Selecionar frase aleatória
      const randomIndex = Math.floor(Math.random() * unseenQuotes.length);
      const selectedQuote = unseenQuotes[randomIndex];

      // Marcar como vista
      const { error: insertError } = await supabase
        .from('user_daily_quotes')
        .insert({
          user_id: user?.id,
          quote_id: selectedQuote.id,
        });

      if (insertError) throw insertError;

      setQuote(selectedQuote);
    } catch (err: any) {
      console.error('Erro ao buscar frase:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { quote, loading, error, refetch: fetchDailyQuote };
};
