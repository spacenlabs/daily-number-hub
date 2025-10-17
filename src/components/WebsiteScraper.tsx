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

      // Map scraped results to game IDs
      const resultsToUpload = scrapedResults
        .map((result) => {
          const game = games?.find(
            (g) => 
              g.name.toLowerCase() === result.game_name.toLowerCase() ||
              g.short_code.toLowerCase() === result.game_name.toLowerCase()
          );

          if (!game) {
            console.warn(`Game not found: ${result.game_name}`);
            return null;
          }

          return {
            game_id: game.id,
            result: result.result,
            result_date: result.date,
            mode: 'auto' as const,
          };
        })
        .filter((r) => r !== null);

      if (resultsToUpload.length === 0) {
        toast.error('No matching games found in your database');
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
        body: { results: resultsToUpload },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast.success(`Successfully imported ${data.success_count} results`);
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
                  <span className="font-medium">{result.game_name}</span>
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
