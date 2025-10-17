import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedResult {
  game_name: string;
  result: number;
  date: string;
  scheduled_time?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching website:', url);

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
    console.log('Fetched HTML, length:', html.length);

    // Parse HTML and extract results
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    const results: ScrapedResult[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Find all game boards (both full and half width)
    const fullBoards = doc.querySelectorAll('.gboardfull');
    const halfBoards = doc.querySelectorAll('.gboardhalf');

    // Process full width boards
    fullBoards.forEach((board) => {
      const gameName = board.querySelector('.gbfullgamename')?.textContent?.trim();
      const timeElement = board.querySelector('font')?.textContent?.trim();
      const resultElements = board.querySelectorAll('.gbfullresult');
      
      // Extract time from format like "( 04:00 AM )"
      let scheduledTime = '';
      if (timeElement) {
        const timeMatch = timeElement.match(/\(\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*\)/i);
        if (timeMatch && timeMatch[1]) {
          scheduledTime = timeMatch[1].trim();
        }
      }
      
      if (gameName && resultElements.length > 1) {
        const resultText = resultElements[resultElements.length - 1]?.textContent?.trim();
        if (resultText) {
          const match = resultText.match(/\[\s*(\d+)\s*\]/);
          if (match && match[1]) {
            results.push({
              game_name: gameName,
              result: parseInt(match[1]),
              date: today,
              scheduled_time: scheduledTime
            });
          }
        }
      }
    });

    // Process half width boards
    halfBoards.forEach((board) => {
      const gameName = board.querySelector('.gbgamehalf')?.textContent?.trim();
      const timeElement = board.querySelector('.gbhalftime')?.textContent?.trim();
      const resultText = board.querySelector('.gbhalfresultn')?.textContent?.trim();
      
      // Extract time from format like "( 05:10 AM )"
      let scheduledTime = '';
      if (timeElement) {
        const timeMatch = timeElement.match(/\(\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*\)/i);
        if (timeMatch && timeMatch[1]) {
          scheduledTime = timeMatch[1].trim();
        }
      }
      
      if (gameName && resultText) {
        const match = resultText.match(/\[\s*(\d+)\s*\]/);
        if (match && match[1]) {
          results.push({
            game_name: gameName,
            result: parseInt(match[1]),
            date: today,
            scheduled_time: scheduledTime
          });
        }
      }
    });

    console.log('Scraped results:', results.length);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in scrape-website function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
