import React, { useMemo } from 'react';
import { Game } from '@/contexts/GamesProvider';
import { isGameUpcoming, isGameOverdue } from '@/lib/time-utils';
import { Clock, CheckCircle, Timer } from 'lucide-react';
interface ResultsBannerProps {
  games: Game[];
}
const ResultsBanner: React.FC<ResultsBannerProps> = ({
  games
}) => {
  const { waitGames, publishedGames } = useMemo(() => {
    const wait = games.filter(game => {
      const hasNoResult = game.today_result === null || game.today_result === undefined;
      const isPending = game.status === 'pending';
      const isUpcoming = isGameUpcoming(game.scheduled_time);
      const isOverdue = isGameOverdue(game.scheduled_time);
      return hasNoResult && (isPending || isUpcoming || isOverdue);
    });
    
    const published = games.filter(game => game.status === 'published' && game.today_result !== null && game.today_result !== undefined);
    
    return { waitGames: wait, publishedGames: published };
  }, [games]);
  return <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-y border-border">
      
    </div>;
};

export default React.memo(ResultsBanner);