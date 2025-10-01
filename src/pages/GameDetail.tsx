import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGames } from "@/hooks/useGames";
import { useGameResultsHistory } from "@/hooks/useGameResultsHistory";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const GameDetail = () => {
  const { id } = useParams();
  const { games, loading: gamesLoading } = useGames();
  const { results, loading: resultsLoading } = useGameResultsHistory(id || '');
  
  const game = games.find(g => g.id === id);
  const loading = gamesLoading || resultsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
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
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-muted/30">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
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
        <div className="grid gap-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Results History
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Jump to Date
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Results List */}
          <Card>
            <CardContent className="p-0">
              {results.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No results history available for this game yet.
                </div>
              ) : (
                <div className="divide-y">
                  {results.map((result) => (
                    <div key={result.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-8">
                        <div className="text-sm w-32">
                          {format(new Date(result.result_date), 'dd-MM-yy')}
                        </div>
                        <div className="text-lg font-medium">
                          {result.result}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;