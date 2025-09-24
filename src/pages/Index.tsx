import { useState } from "react";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/GameCard";
import { useGames } from "@/hooks/useGames";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

const Index = () => {
  const { games, loading } = useGames();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");
  
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    if (username === 'Admin' && password === 'Lottery@123') {
      navigate('/admin/dashboard');
    } else {
      setLoginError('Invalid credentials. Use Username: Admin, Password: Lottery@123');
    }
  };

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

      {/* Admin Login Section */}
      <section className="py-12 bg-card/50 border-t border-neon-cyan/20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-neon-cyan mb-2">Admin Access</h2>
              <p className="text-muted-foreground">Login to manage games and results</p>
            </div>
            <div className="bg-card/80 backdrop-blur border border-neon-cyan/30 rounded-lg p-6 shadow-neon">
              <form onSubmit={handleLogin}>
                {loginError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{loginError}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                    <input 
                      name="username"
                      type="text" 
                      required
                      className="w-full px-3 py-2 bg-background/50 border border-neon-cyan/30 rounded-md text-foreground focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                    <input 
                      name="password"
                      type="password" 
                      required
                      className="w-full px-3 py-2 bg-background/50 border border-neon-cyan/30 rounded-md text-foreground focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all"
                      placeholder="Enter password"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:from-neon-purple hover:to-neon-cyan text-background font-bold py-2 px-4 rounded-md shadow-neon-button hover:shadow-neon-button-hover transition-all duration-300 animate-pulse-neon">
                    🔐 Access Admin Panel
                  </Button>
                </div>
              </form>
            </div>
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