import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Game {
  id: string;
  name: string;
  shortCode: string;
  scheduledTime: string;
  todayResult?: number;
  yesterdayResult?: number;
  status: 'published' | 'pending' | 'manual';
  enabled: boolean;
}

export const useGames = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('scheduled_time');
      
      if (error) throw error;
      
      const formattedGames: Game[] = data.map(game => ({
        id: game.id,
        name: game.name,
        shortCode: game.short_code,
        scheduledTime: game.scheduled_time,
        todayResult: game.today_result,
        yesterdayResult: game.yesterday_result,
        status: game.status as 'published' | 'pending' | 'manual',
        enabled: game.enabled,
      }));
      
      setGames(formattedGames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const updateGameResult = async (gameId: string, result: number) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          today_result: result, 
          status: 'published' 
        })
        .eq('id', gameId);
      
      if (error) throw error;
      
      // Refresh games after update
      await fetchGames();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update game result');
    }
  };

  useEffect(() => {
    fetchGames();

    // Set up real-time subscription
    const channel = supabase
      .channel('games-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games'
        },
        () => {
          fetchGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    games,
    loading,
    error,
    updateGameResult,
    refetch: fetchGames
  };
};