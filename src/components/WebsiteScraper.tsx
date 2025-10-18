import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, X } from 'lucide-react';

interface ScrapedResult {
  game_name: string;
  result: number | null;
  date: string;
  scheduled_time?: string;
  selected?: boolean;
  websiteUrl?: string;
}

export const WebsiteScraper = () => {
  const [urls, setUrls] = useState<string[]>(['https://satta-king-fixed-no.in/']);
  const [loading, setLoading] = useState(false);
  const [scrapedResults, setScrapedResults] = useState<ScrapedResult[]>([]);

  const addUrlField = () => {
    setUrls([...urls, '']);
  };

  const removeUrlField = (index: number) => {
    if (urls.length === 1) {
      toast.error('At least one URL is required');
      return;
    }
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleScrape = async () => {
    const validUrls = urls.filter(url => url.trim() !== '');
    
    if (validUrls.length === 0) {
      toast.error('Please enter at least one URL');
      return;
    }

    setLoading(true);
    const allResults: ScrapedResult[] = [];

    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to scrape websites');
        return;
      }

      // Scrape each website
      for (const url of validUrls) {
        try {
          const { data, error } = await supabase.functions.invoke('scrape-website', {
            body: { url },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (error) {
            console.error(`Error scraping ${url}:`, error);
            toast.error(`Failed to scrape ${url}`);
            continue;
          }

          const results = data?.results || [];
          // Add selected flag (default true) and website URL to each result
          const resultsWithSelection = results.map((r: ScrapedResult) => ({
            ...r,
            selected: true,
            websiteUrl: url
          }));
          
          allResults.push(...resultsWithSelection);
        } catch (error) {
          console.error(`Error scraping ${url}:`, error);
          toast.error(`Failed to scrape ${url}`);
        }
      }

      if (allResults.length === 0) {
        toast.error('No results found on any website');
        return;
      }

      setScrapedResults(allResults);
      toast.success(`Found ${allResults.length} results from ${validUrls.length} website(s)`);
    } catch (error) {
      console.error('Scraping error:', error);
      toast.error('Failed to scrape websites. Please check the URLs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleResultSelection = (index: number) => {
    const newResults = [...scrapedResults];
    newResults[index].selected = !newResults[index].selected;
    setScrapedResults(newResults);
  };

  const selectAllResults = () => {
    const newResults = scrapedResults.map(r => ({ ...r, selected: true }));
    setScrapedResults(newResults);
  };

  const deselectAllResults = () => {
    const newResults = scrapedResults.map(r => ({ ...r, selected: false }));
    setScrapedResults(newResults);
  };

  const handleImport = async () => {
    const selectedResults = scrapedResults.filter(r => r.selected);
    
    if (selectedResults.length === 0) {
      toast.error('No results selected. Please select at least one result to import.');
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

      // Map selected results to game IDs, create games if they don't exist
      const resultsToUpload = await Promise.all(
        selectedResults.map(async (result) => {
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

          // Only create result entry if result is not null
          if (result.result !== null) {
            return {
              game_id: game.id,
              result: result.result,
              result_date: result.date,
              mode: 'auto' as const,
            };
          }
          
          return null;
        })
      );

      const validResults = resultsToUpload.filter((r) => r !== null);

      if (validResults.length === 0 && createdGamesCount === 0) {
        toast.error('No valid data to import');
        return;
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to import results');
        return;
      }

      let importMessage = '';
      
      // Call the bulk upload edge function only if there are results to upload
      if (validResults.length > 0) {
        const { data, error } = await supabase.functions.invoke('bulk-results-upload', {
          body: { results: validResults },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;
        
        importMessage = `Imported ${data.success_count} results`;
      }

      if (createdGamesCount > 0) {
        const gamesMessage = `Created ${createdGamesCount} new games`;
        importMessage = importMessage 
          ? `${gamesMessage} and ${importMessage.toLowerCase()}`
          : gamesMessage;
      }
      
      toast.success(importMessage || 'Import completed');
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
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Website URLs</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUrlField}
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Website
            </Button>
          </div>
          
          {urls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="url"
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
                placeholder="https://example.com"
                disabled={loading}
              />
              {urls.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUrlField(index)}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleScrape}
            disabled={loading || urls.every(u => !u.trim())}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              'Scrape Websites'
            )}
          </Button>

          {scrapedResults.length > 0 && (
            <Button
              onClick={handleImport}
              disabled={loading || !scrapedResults.some(r => r.selected)}
              variant="default"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${scrapedResults.filter(r => r.selected).length} Selected`
              )}
            </Button>
          )}
        </div>

        {scrapedResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <Label>Scraped Results ({scrapedResults.filter(r => r.selected).length} selected):</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllResults}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deselectAllResults}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto rounded border p-2 space-y-1">
              {scrapedResults.map((result, idx) => (
                <div
                  key={idx}
                  className="text-sm flex items-start gap-3 py-2 px-2 hover:bg-accent rounded"
                >
                  <Checkbox
                    checked={result.selected}
                    onCheckedChange={() => toggleResultSelection(idx)}
                    className="mt-1"
                  />
                  <div className="flex-1 flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-medium">{result.game_name}</span>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {result.scheduled_time && (
                          <span>Time: {result.scheduled_time}</span>
                        )}
                        {result.result !== null && (
                          <span>Result: {result.result}</span>
                        )}
                        {result.result === null && (
                          <span className="text-yellow-600">No result</span>
                        )}
                      </div>
                      {result.websiteUrl && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          Source: {result.websiteUrl}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {result.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
