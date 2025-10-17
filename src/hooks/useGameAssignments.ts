import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GameAssignment {
  id: string;
  user_id: string;
  game_id: string;
  assigned_by: string | null;
  assigned_at: string;
  created_at: string;
}

export const useGameAssignments = () => {
  const [assignments, setAssignments] = useState<GameAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async (userId?: string) => {
    try {
      let query = supabase
        .from('game_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Error fetching game assignments:', error);
      toast.error('Failed to load game assignments');
    } finally {
      setLoading(false);
    }
  };

  const assignGame = async (userId: string, gameId: string) => {
    try {
      const { error } = await supabase
        .from('game_assignments')
        .insert({ user_id: userId, game_id: gameId });

      if (error) throw error;
      
      toast.success('Game assigned successfully');
      await fetchAssignments();
      return { success: true };
    } catch (error: any) {
      console.error('Error assigning game:', error);
      toast.error('Failed to assign game');
      return { success: false, error };
    }
  };

  const unassignGame = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('game_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      
      toast.success('Game unassigned successfully');
      await fetchAssignments();
      return { success: true };
    } catch (error: any) {
      console.error('Error unassigning game:', error);
      toast.error('Failed to unassign game');
      return { success: false, error };
    }
  };

  const getUserGames = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('game_assignments')
        .select('game_id, games(*)')
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map(a => a.games).filter(Boolean) || [];
    } catch (error: any) {
      console.error('Error fetching user games:', error);
      return [];
    }
  };

  const getAssignedGameIds = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('game_assignments')
        .select('game_id')
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map(a => a.game_id) || [];
    } catch (error: any) {
      console.error('Error fetching assigned game IDs:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return {
    assignments,
    loading,
    fetchAssignments,
    assignGame,
    unassignGame,
    getUserGames,
    getAssignedGameIds,
  };
};
