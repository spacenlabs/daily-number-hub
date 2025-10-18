import React from 'react';
import { useGames } from '@/hooks/useGames';
import { getDisplayStatus } from '@/lib/time-utils';
import { format } from 'date-fns';

const TopResultsHeader = () => {
  const { games, loading } = useGames();
  const currentDateTime = format(new Date(), 'dd MMMM yyyy h:mm aa');

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

  if (loading) {
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

  // Separate games into published with results and waiting games
  const publishedGames = games
    .filter(game => game.status === 'published' && game.today_result !== null && game.today_result !== undefined)
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
  
  const waitingGames = games
    .filter(game => {
      const displayStatus = getDisplayStatus(game);
      return displayStatus && displayStatus.type === 'wait';
    })
    .sort((a, b) => convertTo24(a.scheduled_time) - convertTo24(b.scheduled_time));

  // Display logic: Show all overdue/wait games, plus most recent published result
  let displayedGames = [];
  
  if (waitingGames.length > 0) {
    // Show 1 most recent published game (by update time) + ALL waiting games
    if (publishedGames.length > 0) {
      displayedGames.push(publishedGames[publishedGames.length - 1]);
    }
    displayedGames.push(...waitingGames);
  } else {
    // No waiting games, take 2 most recent published games (by update time)
    displayedGames = publishedGames.slice(-2);
  }
  
  // Sort final display by scheduled time to maintain order
  displayedGames.sort((a, b) => convertTo24(a.scheduled_time) - convertTo24(b.scheduled_time));

  return (
    <div className="w-full bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        {/* Date and Time Header */}
        <h1 className="text-base font-bold text-neon-pink">
          {currentDateTime}
        </h1>

        {/* Main Title */}
        <h2 className="text-base font-bold text-foreground">
          Satta King Live Result Today
        </h2>

        {/* Games Results */}
        <div className="space-y-8 mt-12">
          {displayedGames.map((game, index) => {
            const displayStatus = getDisplayStatus(game);
            
            // Don't render upcoming games (when displayStatus is null)
            if (!displayStatus) return null;
            
            return (
              <div key={game.id} className="space-y-2">
                {/* Game Name */}
                <div className="text-base font-bold text-destructive uppercase tracking-wider">
                  {game.name}
                </div>
                
                {/* Result or WAIT */}
                <div className={`text-base font-bold ${
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
};

export default TopResultsHeader;