import { useState } from "react";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/GameCard";
import { useNavigate } from "react-router-dom";
import { useGames } from "@/hooks/useGames";
import heroImage from "@/assets/hero-bg.jpg";

const Index = () => {
  const { games, loading } = useGames();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    if (username === "Admin" && password === "Lottery@123") {
      navigate('/admin/dashboard');
    } else {
      setLoginError("Invalid credentials. Please try again.");
    }
  };
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
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="text-lg text-muted-foreground">Loading games...</div>
              </div>
            ) : (
              games.map((game) => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  name={game.name}
                  shortCode={game.shortCode}
                  scheduledTime={game.scheduledTime}
                  todayResult={game.todayResult}
                  yesterdayResult={game.yesterdayResult}
                  status={game.status}
                />
              ))
            )}
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
                <div className="space-y-4">
                  {loginError && (
                    <div className="text-red-500 text-sm text-center py-2 bg-red-500/10 rounded-md border border-red-500/30">
                      {loginError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-background/50 border border-neon-cyan/30 rounded-md text-foreground focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-background/50 border border-neon-cyan/30 rounded-md text-foreground focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all"
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
