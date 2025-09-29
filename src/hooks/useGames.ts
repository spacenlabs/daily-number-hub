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

export const useGames = (opts?: { enableRealtime?: boolean }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      // Only show loading spinner for the very first fetch
      if (!hasLoadedOnce) {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('games')
        .select('id, name, short_code, scheduled_time, today_result, yesterday_result, status, enabled, updated_at')
        .order('scheduled_time');

      if (error) throw error;

      const sortedGames = (data || []).map(game => ({
        ...game,
        status: game.status as 'published' | 'pending' | 'manual'
      }));

      setGames(sortedGames);
      
      if (!hasLoadedOnce) {
        setHasLoadedOnce(true);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
      if (!hasLoadedOnce) {
        setLoading(false);
      }
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

    if (! (opts?.enableRealtime ?? true)) {
      // Realtime disabled: do not subscribe, no polling either
      return;
    }

    // Set up real-time subscription only when enabled
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
          
          // Handle different real-time events without refetching everything
          if (payload.eventType === 'UPDATE') {
            const updatedGame = payload.new as Game;
            setGames(prevGames => {
              const updatedGames = prevGames.map(game => {
                if (game.id === updatedGame.id) {
                  // Only update if relevant fields actually changed
                  const hasChanges = 
                    game.status !== updatedGame.status ||
                    game.today_result !== updatedGame.today_result ||
                    game.yesterday_result !== updatedGame.yesterday_result ||
                    game.enabled !== updatedGame.enabled ||
                    game.updated_at !== updatedGame.updated_at;
                  
                  return hasChanges ? { ...game, ...updatedGame } : game;
                }
                return game;
              });
              
              // Keep stable sort order by scheduled_time
              return updatedGames.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
            });
          } else if (payload.eventType === 'INSERT') {
            const newGame = payload.new as Game;
            setGames(prevGames => {
              const gameExists = prevGames.some(game => game.id === newGame.id);
              if (!gameExists) {
                return [...prevGames, newGame].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
              }
              return prevGames;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setGames(prevGames => prevGames.filter(game => game.id !== deletedId));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [opts?.enableRealtime]);

  return {
    games,
    loading,
    hasLoadedOnce,
    error,
    updateGameResult,
    editGameResult,
    editYesterdayGameResult,
    refetch: fetchGames
  };
};