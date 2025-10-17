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
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const fetchGames = async (userId?: string) => {
    try {
      setLoading(true);
      
      if (userId) {
        // Fetch games assigned to specific user
        const { data: assignments, error: assignError } = await supabase
          .from('game_assignments')
          .select('game_id')
          .eq('user_id', userId);

        if (assignError) throw assignError;

        const gameIds = assignments?.map(a => a.game_id) || [];
        
        if (gameIds.length === 0) {
          setGames([]);
          return;
        }

        const { data, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .in('id', gameIds)
          .order('scheduled_time', { ascending: true });

        if (gamesError) throw gamesError;
        setGames((data as Game[]) || []);
      } else {
        // Fetch all games for public view (filtered by active users)
        const { data, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .order('scheduled_time', { ascending: true });

        if (gamesError) throw gamesError;
        setGames((data as Game[]) || []);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedGames = async () => {
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

  const addGame = async (game: { name: string; short_code: string; scheduled_time: string; enabled: boolean }) => {
    try {
      const { error } = await supabase
        .from('games')
        .insert([game]);

      if (error) throw error;

      await fetchGames();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to add game' 
      };
    }
  };

  const updateGame = async (gameId: string, updates: { name?: string; short_code?: string; scheduled_time?: string; enabled?: boolean }) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;

      // Update local state
      setGames(prevGames => 
        prevGames.map(game => 
          game.id === gameId 
            ? { ...game, ...updates }
            : game
        )
      );

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update game' 
      };
    }
  };

  const deleteGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (error) throw error;

      setGames(prevGames => prevGames.filter(game => game.id !== gameId));
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete game' 
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
        if (status === 'SUBSCRIBED') setIsRealtimeConnected(true);
        if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') setIsRealtimeConnected(false);
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
    addGame,
    updateGame,
    deleteGame,
    refetch: fetchGames
  };
};