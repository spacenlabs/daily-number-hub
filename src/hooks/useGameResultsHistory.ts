import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GameResultHistory {
  id: string;
  game_id: string;
  result: number;
  result_date: string;
  published_at: string | null;
  mode: 'auto' | 'manual';
  note: string | null;
  created_at: string;
  updated_at: string;
}

export const useGameResultsHistory = (gameId: string) => {
  const [results, setResults] = useState<GameResultHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('game_results_history')
        .select('*')
        .eq('game_id', gameId)
        .order('result_date', { ascending: false });

      if (fetchError) throw fetchError;

      setResults((data || []) as GameResultHistory[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching game results history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch results history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameId) {
      fetchResults();

      // Set up real-time subscription
      const channel = supabase
        .channel(`game_results_history:${gameId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_results_history',
            filter: `game_id=eq.${gameId}`
          },
          () => {
            fetchResults();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [gameId]);

  return { results, loading, error, refetch: fetchResults };
};
