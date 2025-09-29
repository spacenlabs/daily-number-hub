import React from 'react';
import { useGames } from '@/hooks/useGames';
import { format } from 'date-fns';

const TopResultsHeader = () => {
  const { games, loading } = useGames();
  const currentDateTime = format(new Date(), 'dd MMMM yyyy h:mm aa');

  if (loading) {
    return (
      <div className="w-full bg-white py-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded mx-auto w-3/4"></div>
          <div className="h-12 bg-gray-200 rounded mx-auto w-1/2"></div>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-8 bg-gray-200 rounded mx-auto w-1/3"></div>
                <div className="h-16 bg-gray-200 rounded mx-auto w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayedGames = games.slice(0, 4); // Show first 4 games

  return (
    <div className="w-full bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        {/* Date and Time Header */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-pink-600">
          {currentDateTime}
        </h1>

        {/* Main Title */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black">
          Satta King Live Result Today
        </h2>

        {/* Games Results */}
        <div className="space-y-8 mt-12">
          {displayedGames.map((game, index) => (
            <div key={game.id} className="space-y-2">
              {/* Game Name */}
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-600 uppercase tracking-wider">
                {game.name}
              </div>
              
              {/* Result or Status */}
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-green-600">
                {game.today_result !== null ? game.today_result : 'WAIT'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopResultsHeader;