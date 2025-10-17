import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ScrapedResult {
  game_name: string;
  result: number;
  date: string;
  scheduled_time?: string;
}

export const WebsiteScraper = () => {
  const [url, setUrl] = useState('https://satta-king-fixed-no.in/');
  const [loading, setLoading] = useState(false);
  const [scrapedResults, setScrapedResults] = useState<ScrapedResult[]>([]);

  const handleScrape = async () => {
    setLoading(true);
    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to scrape websites');
        return;
      }

      // Call the edge function to scrape the website
      const { data, error } = await supabase.functions.invoke('scrape-website', {
        body: { url },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const results = data?.results || [];

      if (results.length === 0) {
        toast.error('No results found on the website');
        return;
      }

      setScrapedResults(results);
      toast.success(`Found ${results.length} results`);
    } catch (error) {
      console.error('Scraping error:', error);
      toast.error('Failed to scrape website. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (scrapedResults.length === 0) {
      toast.error('No results to import. Please scrape first.');
      return;
    }

    setLoading(true);
    try {
      // Get all games to map names to IDs
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, name, short_code');

      if (gamesError) throw gamesError;

      let createdGamesCount = 0;

      // Map scraped results to game IDs, create games if they don't exist
      const resultsToUpload = await Promise.all(
        scrapedResults.map(async (result) => {
          let game = games?.find(
            (g) => 
              g.name.toLowerCase() === result.game_name.toLowerCase() ||
              g.short_code.toLowerCase() === result.game_name.toLowerCase()
          );

          // If game doesn't exist, create it
          if (!game) {
            console.log(`Creating new game: ${result.game_name}`);
            
            const shortCode = result.game_name
              .substring(0, 3)
              .toUpperCase()
              .replace(/\s/g, '');

            const { data: newGame, error: createError } = await supabase
              .from('games')
              .insert({
                name: result.game_name,
                short_code: shortCode,
                scheduled_time: result.scheduled_time || '12:00 PM',
                enabled: true,
              })
              .select()
              .single();

            if (createError) {
              console.error(`Failed to create game ${result.game_name}:`, createError);
              return null;
            }

            game = newGame;
            createdGamesCount++;
          }

          return {
            game_id: game.id,
            result: result.result,
            result_date: result.date,
            mode: 'auto' as const,
          };
        })
      );

      const validResults = resultsToUpload.filter((r) => r !== null);

      if (validResults.length === 0) {
        toast.error('Failed to process results');
        return;
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to import results');
        return;
      }

      // Call the bulk upload edge function
      const { data, error } = await supabase.functions.invoke('bulk-results-upload', {
        body: { results: validResults },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const message = createdGamesCount > 0 
        ? `Created ${createdGamesCount} new games and imported ${data.success_count} results`
        : `Successfully imported ${data.success_count} results`;
      
      toast.success(message);
      setScrapedResults([]);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Results from Website</CardTitle>
        <CardDescription>
          Scrape and import game results from external websites
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">Website URL</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleScrape}
            disabled={loading || !url}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              'Scrape Website'
            )}
          </Button>

          {scrapedResults.length > 0 && (
            <Button
              onClick={handleImport}
              disabled={loading}
              variant="default"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${scrapedResults.length} Results`
              )}
            </Button>
          )}
        </div>

        {scrapedResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <Label>Scraped Results Preview:</Label>
            <div className="max-h-48 overflow-y-auto rounded border p-2 space-y-1">
              {scrapedResults.map((result, idx) => (
                <div
                  key={idx}
                  className="text-sm flex justify-between items-center py-1 px-2 hover:bg-accent rounded"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{result.game_name}</span>
                    {result.scheduled_time && (
                      <span className="text-xs text-muted-foreground">
                        Time: {result.scheduled_time}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {result.result} ({result.date})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
