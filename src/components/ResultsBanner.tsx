import React from 'react';
import { Game } from '@/hooks/useGames';
import { isGameUpcoming, isGameOverdue } from '@/lib/time-utils';
import { Clock, CheckCircle, Timer } from 'lucide-react';

interface ResultsBannerProps {
  games: Game[];
}

export const ResultsBanner: React.FC<ResultsBannerProps> = ({ games }) => {
  const waitGames = games.filter(game => {
    const hasNoResult = !game.today_result;
    const isPending = game.status === 'pending';
    const isUpcoming = isGameUpcoming(game.scheduled_time);
    const isOverdue = isGameOverdue(game.scheduled_time);
    
    return hasNoResult && (isPending || isUpcoming || isOverdue);
  });

  const publishedGames = games.filter(game => 
    game.status === 'published' && game.today_result !== null && game.today_result !== undefined
  );

  return (
    <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-y border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* WAIT Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-warning">
              <Timer className="w-5 h-5" />
              <h3 className="font-semibold text-lg">WAIT ({waitGames.length})</h3>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {waitGames.length > 0 ? (
                <div
                  key={waitGames[0].id}
                  className="flex-shrink-0 bg-gradient-to-br from-warning/20 to-warning/10 border-2 border-warning/40 rounded-xl px-8 py-6 min-w-[240px] shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
                >
                  <div className="text-sm font-medium text-warning">{waitGames[0].name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {waitGames[0].scheduled_time}
                  </div>
                  <div className="text-xs font-bold text-red-600 mt-1">
                    WAIT
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm italic">No games waiting</div>
              )}
            </div>
          </div>

          {/* Published Results Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-5 h-5" />
              <h3 className="font-semibold text-lg">TODAY'S RESULTS ({publishedGames.length})</h3>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {publishedGames.length > 0 ? (
                publishedGames.map(game => (
                  <div
                    key={game.id}
                    className="flex-shrink-0 bg-success/10 border border-success/20 rounded-lg px-4 py-2 min-w-[140px]"
                  >
                    <div className="text-sm font-medium text-success">{game.short_code}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {game.scheduled_time}
                    </div>
                    <div className="text-lg font-bold text-success mt-1">
                      {game.today_result}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-sm italic">No results published yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};