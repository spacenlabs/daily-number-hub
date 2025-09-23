import { Button } from "@/components/ui/button";
import GameCard from "@/components/GameCard";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

// Mock data for games
const mockGames = [
  {
    id: "1",
    name: "Darbhanga King",
    shortCode: "DK",
    scheduledTime: "11:00",
    todayResult: 73,
    yesterdayResult: 45,
    status: "published" as const,
  },
  {
    id: "2", 
    name: "Samastipur King",
    shortCode: "SK",
    scheduledTime: "14:00",
    todayResult: 28,
    yesterdayResult: 92,
    status: "published" as const,
  },
  {
    id: "3",
    name: "Madhubani King", 
    shortCode: "MK",
    scheduledTime: "15:00",
    todayResult: 56,
    yesterdayResult: 17,
    status: "published" as const,
  },
  {
    id: "4",
    name: "Sitamarhi King",
    shortCode: "SMK", 
    scheduledTime: "16:00",
    todayResult: undefined,
    yesterdayResult: 84,
    status: "pending" as const,
  },
  {
    id: "5",
    name: "Shri Ganesh",
    shortCode: "SG", 
    scheduledTime: "16:30",
    todayResult: undefined,
    yesterdayResult: 63,
    status: "pending" as const,
  },
  {
    id: "6",
    name: "Chakiya King",
    shortCode: "CK", 
    scheduledTime: "17:00",
    todayResult: undefined,
    yesterdayResult: 39,
    status: "pending" as const,
  },
  {
    id: "7",
    name: "Faridabad",
    shortCode: "FB", 
    scheduledTime: "18:00",
    todayResult: undefined,
    yesterdayResult: 75,
    status: "pending" as const,
  },
  {
    id: "8",
    name: "Muzaffarpur King",
    shortCode: "MZK", 
    scheduledTime: "19:00",
    todayResult: undefined,
    yesterdayResult: 21,
    status: "pending" as const,
  },
  {
    id: "9",
    name: "Ghaziabad",
    shortCode: "GZB", 
    scheduledTime: "20:30",
    todayResult: undefined,
    yesterdayResult: 68,
    status: "pending" as const,
  },
  {
    id: "10",
    name: "Ara King",
    shortCode: "AK", 
    scheduledTime: "21:30",
    todayResult: undefined,
    yesterdayResult: 94,
    status: "pending" as const,
  },
  {
    id: "11",
    name: "Chhapra King",
    shortCode: "CHK", 
    scheduledTime: "21:45",
    todayResult: undefined,
    yesterdayResult: 12,
    status: "pending" as const,
  },
  {
    id: "12",
    name: "Patna King",
    shortCode: "PK", 
    scheduledTime: "22:00",
    todayResult: undefined,
    yesterdayResult: 87,
    status: "pending" as const,
  },
  {
    id: "13",
    name: "Gali",
    shortCode: "GL", 
    scheduledTime: "23:30",
    todayResult: undefined,
    yesterdayResult: 35,
    status: "pending" as const,
  },
  {
    id: "14",
    name: "Disawar",
    shortCode: "DS", 
    scheduledTime: "05:00",
    todayResult: 49,
    yesterdayResult: 76,
    status: "published" as const,
  },
];

const Index = () => {
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
            {mockGames.map((game) => (
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
              <form onSubmit={(e) => {
                e.preventDefault();
                // Simple redirect to admin dashboard for demo
                window.location.href = '/admin/dashboard';
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 bg-background/50 border border-neon-cyan/30 rounded-md text-foreground focus:ring-2 focus:ring-neon-cyan focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                    <input 
                      type="password" 
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
