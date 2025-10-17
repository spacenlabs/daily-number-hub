import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGameAssignments } from '@/hooks/useGameAssignments';
import { useGames } from '@/hooks/useGames';

const PUBLIC_DOMAIN = 'https://satta-game.online';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ExternalLink, Trash2, Copy, CheckCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface UserProfile {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  public_username: string | null;
}

const GameAssignmentManager = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userAssignments, setUserAssignments] = useState<Record<string, string[]>>({});
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  const { games } = useGames();
  const { assignGame, unassignGame, fetchAssignments } = useGameAssignments();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchUserAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('game_assignments')
        .select('*');

      if (error) throw error;

      const assignments: Record<string, string[]> = {};
      data?.forEach((assignment) => {
        if (!assignments[assignment.user_id]) {
          assignments[assignment.user_id] = [];
        }
        assignments[assignment.user_id].push(assignment.game_id);
      });

      setUserAssignments(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUserAssignments();
  }, []);

  const handleAssign = async () => {
    if (!selectedUser || !selectedGame) {
      toast.error('Please select both user and game');
      return;
    }

    const result = await assignGame(selectedUser, selectedGame);
    if (result.success) {
      setSelectedGame('');
      fetchUserAssignments();
    }
  };

  const handleUnassign = async (userId: string, gameId: string) => {
    try {
      const { data, error } = await supabase
        .from('game_assignments')
        .select('id')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single();

      if (error) throw error;
      if (data) {
        await unassignGame(data.id);
        fetchUserAssignments();
      }
    } catch (error) {
      console.error('Error unassigning game:', error);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleGenerateUsername = async (userId: string, email: string) => {
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let finalUsername = username;
    let counter = 1;

    // Check if username exists and add counter if needed
    while (true) {
      const { data } = await supabase
        .from('profiles')
        .select('public_username')
        .eq('public_username', finalUsername)
        .maybeSingle();

      if (!data) break;
      finalUsername = `${username}${counter}`;
      counter++;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ public_username: finalUsername })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Public username generated');
      fetchUsers();
    } catch (error) {
      console.error('Error generating username:', error);
      toast.error('Failed to generate username');
    }
  };

  const copyPublicUrl = (username: string, userId: string) => {
    const url = `${PUBLIC_DOMAIN}/u/${username}`;
    navigator.clipboard.writeText(url);
    setCopiedUserId(userId);
    toast.success('Public URL copied!');
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  const getUserName = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.first_name || user.email;
  };

  const getGameName = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    return game?.name || 'Unknown Game';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Assign Game to User</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Select User</label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {getUserName(user)} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Select Game</label>
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a game" />
              </SelectTrigger>
              <SelectContent>
                {games.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAssign}>Assign Game</Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Assigned Games</TableHead>
              <TableHead>Public URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell className="font-medium">{getUserName(user)}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Switch
                    checked={user.is_active}
                    onCheckedChange={() => handleToggleActive(user.user_id, user.is_active)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {userAssignments[user.user_id]?.map((gameId) => (
                      <Badge key={gameId} variant="secondary" className="gap-1">
                        {getGameName(gameId)}
                        <button
                          onClick={() => handleUnassign(user.user_id, gameId)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    )) || <span className="text-muted-foreground text-sm">No games assigned</span>}
                  </div>
                </TableCell>
                <TableCell>
                  {user.public_username ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyPublicUrl(user.public_username!, user.user_id)}
                      >
                        {copiedUserId === user.user_id ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <a
                        href={`${PUBLIC_DOMAIN}/u/${user.public_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        {PUBLIC_DOMAIN}/u/{user.public_username}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateUsername(user.user_id, user.email)}
                    >
                      Generate URL
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GameAssignmentManager;
