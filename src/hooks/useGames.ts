import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Game {
  id: string;
  name: string;
  short_code: string;
  scheduled_time: string;
  today_result?: number | null;
  yesterday_result?: number | null;
  status: 'published' | 'pending' | 'manual';
  enabled: boolean;
  updated_at: string;
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

      setGames((data || []).map(game => ({
        ...game,
        status: game.status as 'published' | 'pending' | 'manual'
      })));
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
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;

      // Update local state
      setGames(prevGames => 
        prevGames.map(game => 
          game.id === gameId 
            ? { ...game, today_result: result, status: 'published' as const }
            : game
        )
      );

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update result' 
      };
    }
  };

  const editGameResult = async (gameId: string, result: number) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          today_result: result, 
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;

      // Update local state
      setGames(prevGames => 
        prevGames.map(game => 
          game.id === gameId 
            ? { ...game, today_result: result }
            : game
        )
      );

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to edit result' 
      };
    }
  };

  const editYesterdayGameResult = async (gameId: string, result: number) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          yesterday_result: result, 
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;

      // Update local state
      setGames(prevGames => 
        prevGames.map(game => 
          game.id === gameId 
            ? { ...game, yesterday_result: result }
            : game
        )
      );

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to edit yesterday result' 
      };
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
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchGames(); // Refetch when any change happens
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    games,
    loading,
    error,
    updateGameResult,
    editGameResult,
    editYesterdayGameResult,
    refetch: fetchGames
  };
};