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
      {/* Hero Section */}
      <section 
        className="relative bg-cover bg-center bg-no-repeat py-20 md:py-32"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-primary/80"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Results Management System
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            View daily results for multiple scheduled games. Professional, reliable, and always up-to-date.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              View All Results
            </Button>
            <Link to="/admin">
              <Button size="lg" variant="outline" className="text-lg px-8 text-white border-white hover:bg-white hover:text-primary">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Today's Games
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Click on any game card to view detailed results history and export data.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
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

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Results System</h3>
              <p className="text-sm text-muted-foreground">
                A professional platform for managing and displaying scheduled game results.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>This platform displays results only.</p>
                <p>No betting or wagering functions.</p>
                <p>All results are for informational purposes.</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Contact</h3>
              <p className="text-sm text-muted-foreground">
                For technical support or inquiries, please contact your system administrator.
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025 Results Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
