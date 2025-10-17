import React from 'react';
import { Game } from '@/hooks/useGames';
import { isGameUpcoming, isGameOverdue } from '@/lib/time-utils';

interface ResultsBannerProps {
  games: Game[];
}

export const ResultsBanner: React.FC<ResultsBannerProps> = ({ games }) => {
  const waitGames = games.filter((game) => {
    const hasNoResult = game.today_result === null || game.today_result === undefined;
    const isPending = game.status === 'pending';
    const upcoming = isGameUpcoming(game.scheduled_time);
    const overdue = isGameOverdue(game.scheduled_time);
    return hasNoResult && (isPending || upcoming || overdue);
  });

  const publishedGames = games
    .filter((game) => game.status === 'published' && game.today_result !== null && game.today_result !== undefined)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-y border-border">
      <div className="container mx-auto px-2 sm:px-4 py-3">
        {/* Published Results */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Live Results Today</h3>
            <span className="text-xs text-muted-foreground">{publishedGames.length} published</span>
          </div>

          {publishedGames.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {publishedGames.slice(0, 20).map((g) => (
                <div key={g.id} className="px-2 py-1 rounded-md border border-primary/30 bg-primary/10 text-primary text-xs sm:text-sm font-semibold">
                  <span className="">{g.name}</span>
                  <span className="mx-1.5">•</span>
                  <span>{String(g.today_result).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-muted-foreground">No results published yet.</div>
          )}

          {/* Waiting Games */}
          {waitGames.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">Waiting ({waitGames.length})</div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {waitGames.slice(0, 30).map((g) => (
                  <div key={g.id} className="px-2 py-1 rounded-md border border-border bg-card/50 text-xs sm:text-sm">
                    <span className="text-foreground/90">{g.name}</span>
                    <span className="mx-1.5 text-muted-foreground">•</span>
                    <span className="text-warning">WAIT</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
