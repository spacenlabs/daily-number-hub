import React, { useState, useEffect } from 'react';
import { Game } from '@/contexts/GamesProvider';
import { getDisplayStatus } from '@/lib/time-utils';

interface TopResultsHeaderProps {
  games: Game[];
  loading: boolean;
}

const TopResultsHeader: React.FC<TopResultsHeaderProps> = ({ games, loading }) => {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      setCurrentDateTime(now.toLocaleDateString('en-US', options));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show skeleton only if no games data yet AND loading
  if (loading && games.length === 0) {
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
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  
  const waitingGames = games
    .filter(game => {
      const displayStatus = getDisplayStatus(game);
      return displayStatus && displayStatus.type === 'wait';
    });

  // Display logic: 1 recent published result + 1 waiting game if available
  let displayedGames = [];
  
  if (waitingGames.length > 0) {
    // Take 1 most recent published game + 1 waiting game
    if (publishedGames.length > 0) {
      displayedGames.push(publishedGames[0]);
    }
    displayedGames.push(waitingGames[0]);
  } else {
    // No waiting games, take 2 most recent published games
    displayedGames = publishedGames.slice(0, 2);
  }

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
          {displayedGames.map((game, index) => {
            const displayStatus = getDisplayStatus(game);
            
            // Don't render upcoming games (when displayStatus is null)
            if (!displayStatus) return null;
            
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
};

export default TopResultsHeader;