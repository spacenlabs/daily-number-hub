import React from 'react';
import { Game } from '@/hooks/useGames';
import { isGameUpcoming, isGameOverdue } from '@/lib/time-utils';
import { Clock, CheckCircle, Timer } from 'lucide-react';
interface ResultsBannerProps {
  games: Game[];
}
export const ResultsBanner: React.FC<ResultsBannerProps> = ({
  games
}) => {
  const waitGames = games.filter(game => {
    const hasNoResult = !game.today_result;
    const isPending = game.status === 'pending';
    const isUpcoming = isGameUpcoming(game.scheduled_time);
    const isOverdue = isGameOverdue(game.scheduled_time);
    return hasNoResult && (isPending || isUpcoming || isOverdue);
  });
  const publishedGames = games.filter(game => game.status === 'published' && game.today_result !== null && game.today_result !== undefined);
  return <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-y border-border">
      
    </div>;
};