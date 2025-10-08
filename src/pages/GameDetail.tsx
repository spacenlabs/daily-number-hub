import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGames } from "@/hooks/useGames";
import { useGameResultsHistory } from "@/hooks/useGameResultsHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthlyResultsCalendar } from "@/components/MonthlyResultsCalendar";
const GameDetail = () => {
  const {
    id
  } = useParams();
  const {
    games,
    loading: gamesLoading
  } = useGames();
  const {
    results,
    loading: resultsLoading
  } = useGameResultsHistory(id || '');
  const game = games.find(g => g.id === id);
  const loading = gamesLoading || resultsLoading;
  if (loading) {
    return <div className="min-h-screen bg-muted/30">
        <header className="bg-card border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  if (!game) {
    return <div className="min-h-screen bg-muted/30">
        <header className="bg-card border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Games
              </Button>
            </Link>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Game not found</p>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Games
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{game.name}</h1>
              <p className="text-muted-foreground">Scheduled at {game.scheduled_time} daily</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Results History</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No results history available for this game yet.
              </div>
            ) : (
              <MonthlyResultsCalendar results={results} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default GameDetail;