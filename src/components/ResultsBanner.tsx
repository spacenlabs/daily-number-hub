import React from 'react';
import { Game } from '@/hooks/useGames';
import { isGameUpcoming, isGameOverdue } from '@/lib/time-utils';

interface ResultsBannerProps {
  games: Game[];
}

export const ResultsBanner: React.FC<ResultsBannerProps> = ({ games }) => {
  // Helper function to convert time to minutes for sorting
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

  const waitGames = games
    .filter((game) => {
      const hasNoResult = game.today_result === null || game.today_result === undefined;
      const isPending = game.status === 'pending';
      const upcoming = isGameUpcoming(game.scheduled_time);
      const overdue = isGameOverdue(game.scheduled_time);
      return hasNoResult && (isPending || upcoming || overdue);
    })
    .sort((a, b) => convertTo24(a.scheduled_time) - convertTo24(b.scheduled_time));

  const publishedGames = games
    .filter((game) => game.status === 'published' && game.today_result !== null && game.today_result !== undefined)
    .sort((a, b) => convertTo24(a.scheduled_time) - convertTo24(b.scheduled_time));

  return (
    <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-y border-border">
      <div className="container mx-auto px-2 sm:px-4 py-3">
        {/* Published Results */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Live Results Today</h3>
            <span className="text-base text-muted-foreground">{publishedGames.length} published</span>
          </div>

          {publishedGames.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {publishedGames.slice(0, 20).map((g) => (
                <div key={g.id} className="px-2 py-1 rounded-md border border-primary/30 bg-primary/10 text-primary text-base font-semibold">
                  <span className="">{g.name}</span>
                  <span className="mx-1.5">•</span>
                  <span>{String(g.today_result).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-base text-muted-foreground">No results published yet.</div>
          )}

          {/* Waiting Games */}
          {waitGames.length > 0 && (
            <div className="mt-2">
              <div className="text-base text-muted-foreground mb-1">Waiting ({waitGames.length})</div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {waitGames.slice(0, 30).map((g) => (
                  <div key={g.id} className="px-2 py-1 rounded-md border border-border bg-card/50 text-base">
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
