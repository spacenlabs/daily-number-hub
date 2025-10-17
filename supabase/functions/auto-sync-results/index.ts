import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedResult {
  game_name: string;
  result: number | null;
  date: string;
  scheduled_time?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = 'https://satta-king-fixed-no.in/';
    
    console.log('Auto-syncing results from:', url);

    // Fetch the website
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    const results: ScrapedResult[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Parse full width boards
    const fullBoards = doc.querySelectorAll('.gboardfull');
    fullBoards.forEach((board) => {
      const gameName = board.querySelector('.gbfullgamename')?.textContent?.trim();
      const timeElement = board.querySelector('font')?.textContent?.trim();
      const resultElements = board.querySelectorAll('.gbfullresult');
      
      let scheduledTime = '';
      if (timeElement) {
        const timeMatch = timeElement.match(/\(\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*\)/i);
        if (timeMatch && timeMatch[1]) {
          scheduledTime = timeMatch[1].trim();
        }
      }
      
      if (gameName) {
        let result = null;
        if (resultElements.length > 1) {
          const resultText = resultElements[resultElements.length - 1]?.textContent?.trim();
          if (resultText) {
            const match = resultText.match(/\[\s*(\d+)\s*\]/);
            if (match && match[1]) {
              result = parseInt(match[1]);
            }
          }
        }
        
        results.push({
          game_name: gameName,
          result: result,
          date: today,
          scheduled_time: scheduledTime || '12:00 PM'
        });
      }
    });

    // Parse half width boards
    const halfBoards = doc.querySelectorAll('.gboardhalf');
    halfBoards.forEach((board) => {
      const gameName = board.querySelector('.gbgamehalf')?.textContent?.trim();
      const timeElement = board.querySelector('.gbhalftime')?.textContent?.trim();
      const resultText = board.querySelector('.gbhalfresultn')?.textContent?.trim();
      
      let scheduledTime = '';
      if (timeElement) {
        const timeMatch = timeElement.match(/\(\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*\)/i);
        if (timeMatch && timeMatch[1]) {
          scheduledTime = timeMatch[1].trim();
        }
      }
      
      if (gameName) {
        let result = null;
        if (resultText) {
          const match = resultText.match(/\[\s*(\d+)\s*\]/);
          if (match && match[1]) {
            result = parseInt(match[1]);
          }
        }
        
        results.push({
          game_name: gameName,
          result: result,
          date: today,
          scheduled_time: scheduledTime || '12:00 PM'
        });
      }
    });

    console.log('Scraped results:', results.length);

    // Get all existing games
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, name, short_code');

    if (gamesError) throw gamesError;

    let createdGamesCount = 0;
    let updatedResultsCount = 0;

    // Process each scraped result
    for (const result of results) {
      let game = games?.find(
        (g) => 
          g.name.toLowerCase() === result.game_name.toLowerCase() ||
          g.short_code.toLowerCase() === result.game_name.toLowerCase()
      );

      // Create game if it doesn't exist
      if (!game) {
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
          continue;
        }

        game = newGame;
        createdGamesCount++;
        console.log(`Created new game: ${result.game_name}`);
      }

      // Update result if available
      if (result.result !== null && game) {
        // Insert/update in history
        const { error: historyError } = await supabase
          .from('game_results_history')
          .upsert({
            game_id: game.id,
            result: result.result,
            result_date: result.date,
            mode: 'auto',
            published_at: new Date().toISOString()
          }, {
            onConflict: 'game_id,result_date'
          });

        if (historyError) {
          console.error(`Failed to update history for ${game.name}:`, historyError);
          continue;
        }

        // Update today's result in games table
        const { error: gameError } = await supabase
          .from('games')
          .update({
            today_result: result.result,
            status: 'published',
            updated_at: new Date().toISOString()
          })
          .eq('id', game.id);

        if (gameError) {
          console.error(`Failed to update game ${game.name}:`, gameError);
          continue;
        }

        updatedResultsCount++;
        console.log(`Updated result for ${game.name}: ${result.result}`);
      }
    }

    const message = `Auto-sync completed: ${createdGamesCount} games created, ${updatedResultsCount} results updated`;
    console.log(message);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        created_games: createdGamesCount,
        updated_results: updatedResultsCount,
        total_scraped: results.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in auto-sync-results function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
