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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchGames = async () => {
    try {
      // Only set loading true on the very first fetch
      if (isInitialLoad) {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('scheduled_time');

      if (error) throw error;

      setGames((data || []).map(game => ({
        ...game,
        status: game.status as 'published' | 'pending' | 'manual'
      })));
      
      // Mark initial load as complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      if (isInitialLoad) {
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
          // Update state directly instead of refetching to prevent loading flickers
          if (payload.eventType === 'UPDATE' && payload.new) {
            setGames(prevGames => 
              prevGames.map(game => 
                game.id === payload.new.id 
                  ? { ...game, ...payload.new, status: payload.new.status as 'published' | 'pending' | 'manual' }
                  : game
              )
            );
          } else if (payload.eventType === 'INSERT' && payload.new) {
            setGames(prevGames => [...prevGames, { ...payload.new, status: payload.new.status as 'published' | 'pending' | 'manual' } as Game]);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setGames(prevGames => prevGames.filter(game => game.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsRealtimeConnected(true);
        if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') setIsRealtimeConnected(false);
      });

    return () => {
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