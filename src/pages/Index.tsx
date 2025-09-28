import { Button } from "@/components/ui/button";
import GameCard from "@/components/GameCard";
import { useGames } from "@/hooks/useGames";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

const Index = () => {
  const { games, loading } = useGames();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Games Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              Today's Live Results
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              🎯 Click any game card to view complete history and export data
            </p>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto">
            {games.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                name={game.name}
                shortCode={game.short_code}
                scheduledTime={game.scheduled_time}
                todayResult={game.today_result || undefined}
                yesterdayResult={game.yesterday_result || undefined}
                status={game.status}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Admin Login Button */}
      <section className="py-8 bg-card/50 border-t border-neon-cyan/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Button 
              onClick={() => navigate('/admin')}
              variant="outline"
              size="sm"
              className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
            >
              🔐 Admin Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background/80 border-t border-neon-cyan/20 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            © 2025 Lottery Results System. All rights reserved. • Results for informational purposes only.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;