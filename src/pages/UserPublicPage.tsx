import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Game } from '@/hooks/useGames';
import GameCard from '@/components/GameCard';
import TopResultsHeader from '@/components/TopResultsHeader';
import { ResultsBanner } from '@/components/ResultsBanner';
import DateBanner from '@/components/DateBanner';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  is_active: boolean;
  public_username: string | null;
}

const UserPublicPage = () => {
  const { username } = useParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchUserAndGames = async () => {
      try {
        // Fetch user by public_username
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('public_username', username)
          .maybeSingle();

        if (userError) throw userError;
        
        if (!userData || !userData.is_active) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setUser(userData);

        // Fetch games assigned to this user
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('game_assignments')
          .select('game_id')
          .eq('user_id', userData.user_id);

        if (assignmentsError) throw assignmentsError;

        const gameIds = assignmentsData?.map(a => a.game_id) || [];

        if (gameIds.length === 0) {
          setGames([]);
          setLoading(false);
          return;
        }

        // Fetch the actual games
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .in('id', gameIds)
          .eq('enabled', true)
          .order('scheduled_time', { ascending: true });

        if (gamesError) throw gamesError;

        setGames((gamesData as Game[]) || []);
      } catch (error) {
        console.error('Error fetching user games:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserAndGames();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  const userName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user?.first_name || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{userName}'s Results</h1>
          <p className="text-muted-foreground">Live game results and updates</p>
        </div>

        <TopResultsHeader />
        <ResultsBanner games={games} />
        <DateBanner />

        {games.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No games assigned to this user yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {games
              .sort((a, b) => {
                // Convert to 24-hour for comparison
                const convertTo24 = (time: string) => {
                  if (time.includes('AM') || time.includes('PM')) {
                    const timePart = time.replace(/(AM|PM)/i, '').trim();
                    const [hours, minutes] = timePart.split(':').map(Number);
                    const isPM = time.toUpperCase().includes('PM');
                    const hour24 = isPM && hours !== 12 ? hours + 12 : (!isPM && hours === 12 ? 0 : hours);
                    return hour24 * 60 + minutes;
                  }
                  const [hours, minutes] = time.split(':').map(Number);
                  return hours * 60 + minutes;
                };
                
                return convertTo24(a.scheduled_time) - convertTo24(b.scheduled_time);
              })
              .map((game) => (
                <GameCard 
                  key={game.id} 
                  id={game.id}
                  name={game.name}
                  shortCode={game.short_code}
                  scheduledTime={game.scheduled_time}
                  todayResult={game.today_result ?? undefined}
                  yesterdayResult={game.yesterday_result ?? undefined}
                  status={game.status as "published" | "pending" | "manual"}
                />
              ))}
          </div>
        )}

        <div className="mt-12">
          <DateBanner />
        </div>
      </div>
    </div>
  );
};

export default UserPublicPage;
