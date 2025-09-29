import React, { useMemo } from 'react';
import { useGames } from '@/hooks/useGames';
import { getDisplayStatus } from '@/lib/time-utils';
import { format } from 'date-fns';

const TopResultsHeader = React.memo(() => {
  const { games, loading, hasLoadedOnce } = useGames();
  const currentDateTime = format(new Date(), 'dd MMMM yyyy h:mm aa');

  // Only show skeleton during initial load, not during updates
  if (loading && !hasLoadedOnce) {
    return (
      <div className="w-full bg-background py-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded mx-auto w-3/4"></div>
          <div className="h-12 bg-muted rounded mx-auto w-1/2"></div>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-8 bg-muted rounded mx-auto w-1/3"></div>
                <div className="h-16 bg-muted rounded mx-auto w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Memoize game filtering and sorting to prevent unnecessary recalculations
  const displayedGames = useMemo(() => {
    // Separate games into published with results and waiting games
    const publishedGames = games
      .filter(game => game.status === 'published' && game.today_result !== null)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    const waitingGames = games
      .filter(game => {
        const displayStatus = getDisplayStatus(game);
        return displayStatus && displayStatus.type === 'wait';
      });

    // Display logic: 1 recent published result + 1 waiting game if available
    let result = [];
    
    if (waitingGames.length > 0) {
      // Take 1 most recent published game + 1 waiting game
      if (publishedGames.length > 0) {
        result.push(publishedGames[0]);
      }
      result.push(waitingGames[0]);
    } else {
      // No waiting games, take 2 most recent published games
      result = publishedGames.slice(0, 2);
    }

    // Filter out games that shouldn't be displayed to prevent null renders
    return result.filter(game => {
      const displayStatus = getDisplayStatus(game);
      return displayStatus !== null;
    });
  }, [games]);

  return (
    <div className="w-full bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        {/* Date and Time Header */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neon-pink">
          {currentDateTime}
        </h1>

        {/* Main Title */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
          Satta King Live Result Today
        </h2>

        {/* Games Results */}
        <div className="space-y-8 mt-12">
          {displayedGames.map((game) => {
            const displayStatus = getDisplayStatus(game);
            
            return (
              <div key={game.id} className="space-y-2">
                {/* Game Name */}
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-destructive uppercase tracking-wider">
                  {game.name}
                </div>
                
                {/* Result or WAIT */}
                <div className={`text-4xl md:text-5xl lg:text-6xl font-bold ${
                  displayStatus.type === 'result' 
                    ? 'text-success' 
                    : 'text-warning'
                }`}>
                  {displayStatus.type === 'result' 
                    ? String(displayStatus.value).padStart(2, '0')
                    : displayStatus.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default TopResultsHeader;