import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface GamesContextType {
  games: Game[];
  loading: boolean;
  error: string | null;
  updateGameResult: (gameId: string, result: number) => Promise<{ success: boolean; error?: string }>;
  editGameResult: (gameId: string, result: number) => Promise<{ success: boolean; error?: string }>;
  editYesterdayGameResult: (gameId: string, result: number) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

interface GamesProviderProps {
  children: ReactNode;
}

export const GamesProvider: React.FC<GamesProviderProps> = ({ children }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      if (!hasLoadedOnce) {
        setLoading(true);
      }
      setError(null);
      
      const { data, error } = await supabase
        .from('games')
        .select('id, name, short_code, scheduled_time, today_result, yesterday_result, status, enabled, updated_at')
        .order('scheduled_time');

      if (error) throw error;

      const sortedGames = (data || [])
        .map(game => ({
          ...game,
          status: game.status as 'published' | 'pending' | 'manual'
        }))
        .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));

      setGames(sortedGames);
      setHasLoadedOnce(true);
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

    // Set up single real-time subscription for the entire app
    const channel = supabase
      .channel('global-games-changes', {
        config: {
          broadcast: { self: false }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setGames(prevGames => {
              const updatedGames = prevGames.map(game => {
                if (game.id === payload.new.id) {
                  const newGame = { ...game, ...payload.new, status: payload.new.status as 'published' | 'pending' | 'manual' };
                  // Only update if something actually changed
                  const hasChanged = 
                    game.status !== newGame.status ||
                    game.today_result !== newGame.today_result ||
                    game.yesterday_result !== newGame.yesterday_result ||
                    game.enabled !== newGame.enabled ||
                    game.updated_at !== newGame.updated_at;
                  
                  return hasChanged ? newGame : game;
                }
                return game;
              });
              
              // Keep stable sort order
              return updatedGames.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
            });
          } else if (payload.eventType === 'INSERT' && payload.new) {
            setGames(prevGames => {
              const newGames = [...prevGames, { ...payload.new, status: payload.new.status as 'published' | 'pending' | 'manual' } as Game];
              return newGames.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setGames(prevGames => prevGames.filter(game => game.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const value: GamesContextType = {
    games,
    loading,
    error,
    updateGameResult,
    editGameResult,
    editYesterdayGameResult,
    refetch: fetchGames
  };

  return (
    <GamesContext.Provider value={value}>
      {children}
    </GamesContext.Provider>
  );
};

export const useGames = (): GamesContextType => {
  const context = useContext(GamesContext);
  if (context === undefined) {
    throw new Error('useGames must be used within a GamesProvider');
  }
  return context;
};