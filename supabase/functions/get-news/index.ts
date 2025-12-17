import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sources with known strong political bias (left or right leaning)
const BIASED_SOURCES = [
  // Left-leaning partisan sources
  'msnbc',
  'huffpost',
  'huffington post',
  'the daily beast',
  'salon',
  'slate',
  'vox',
  'motherjones',
  'mother jones',
  'the nation',
  'raw story',
  'occupy democrats',
  'addicting info',
  'democratic underground',
  'daily kos',
  'alternet',
  'truthout',
  'thinkprogress',
  'crooks and liars',
  'talking points memo',
  'mediaite',
  
  // Right-leaning partisan sources
  'fox news',
  'breitbart',
  'the daily caller',
  'the daily wire',
  'the blaze',
  'newsmax',
  'one america news',
  'oann',
  'the federalist',
  'washington examiner',
  'the epoch times',
  'townhall',
  'red state',
  'gateway pundit',
  'western journal',
  'national review',
  'american thinker',
  'washington times',
  'daily signal',
  'pj media',
  'the post millennial',
  'infowars',
  
  // Tabloid/sensationalist sources
  'daily mail',
  'new york post',
  'the sun',
  'buzzfeed',
  'buzzfeed news',
  'vice news',
  'mic',
  
  // Foreign state-affiliated media
  'rt',
  'russia today',
  'sputnik',
  'xinhua',
  'global times',
  'press tv',
  'al mayadeen',
];

// Preferred neutral/factual sources (prioritize these)
const NEUTRAL_SOURCES = [
  'associated press',
  'ap news',
  'reuters',
  'bbc',
  'npr',
  'pbs',
  'c-span',
  'the hill',
  'axios',
  'bloomberg',
  'the wall street journal',
  'financial times',
  'the economist',
  'usa today',
  'abc news',
  'cbs news',
  'nbc news',
  'local news',
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { interests, country, city, state } = await req.json();
    const apiKey = Deno.env.get("NEWS_API_KEY");

    if (!apiKey) {
      throw new Error("NEWS_API_KEY not configured");
    }

    // Map country names to NewsAPI country codes
    const countryCodeMap: Record<string, string> = {
      'united states': 'us',
      'usa': 'us',
      'united kingdom': 'gb',
      'uk': 'gb',
      'canada': 'ca',
      'australia': 'au',
      'germany': 'de',
      'france': 'fr',
      'india': 'in',
      'mexico': 'mx',
    };

    const countryLower = (country || '').toLowerCase();
    const countryCode = countryCodeMap[countryLower] || countryLower.slice(0, 2) || 'us';
    const isUSA = countryCode === 'us';

    let url: string;
    
    // Build a more specific location query with city + state for US
    const locationQuery = isUSA && city && state 
      ? `"${city}" "${state}"`
      : city 
        ? `"${city}" "${country || 'USA'}"`
        : null;
    
    // Build interest query
    const interestQuery = interests && interests.length > 0 
      ? interests.slice(0, 3).map((i: string) => `"${i}"`).join(' OR ')
      : null;

    if (locationQuery || interestQuery) {
      // Combine location and interests, prioritizing location news
      const queryParts = [];
      if (locationQuery) queryParts.push(`(${locationQuery})`);
      if (interestQuery) queryParts.push(`(${interestQuery})`);
      
      const query = queryParts.join(' OR ');
      // Request more articles so we have room after filtering biased ones
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${apiKey}`;
    } else {
      // Fallback to top headlines for the user's country
      url = `https://newsapi.org/v2/top-headlines?country=${countryCode}&pageSize=20&apiKey=${apiKey}`;
    }

    console.log("Fetching news from:", url.replace(apiKey, "***"));

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("NewsAPI error:", errorData);
      throw new Error(errorData.message || "Failed to fetch news");
    }

    const data = await response.json();

    // Helper function to check if source is biased
    const isBiasedSource = (sourceName: string): boolean => {
      const normalizedSource = sourceName.toLowerCase().trim();
      return BIASED_SOURCES.some(biased => 
        normalizedSource.includes(biased) || biased.includes(normalizedSource)
      );
    };

    // Helper function to check if source is neutral/preferred
    const isNeutralSource = (sourceName: string): boolean => {
      const normalizedSource = sourceName.toLowerCase().trim();
      return NEUTRAL_SOURCES.some(neutral => 
        normalizedSource.includes(neutral) || neutral.includes(normalizedSource)
      );
    };

    // Filter and validate articles
    const articles = (data.articles || [])
      .filter((article: any) => {
        // Must have a URL that starts with http
        if (!article.url || !article.url.startsWith('http')) {
          console.log(`FILTERED (no valid URL): ${article.title}`);
          return false;
        }
        
        // Filter out removed/unavailable content
        if (article.title === '[Removed]' || article.content === '[Removed]') {
          console.log(`FILTERED (removed content): ${article.url}`);
          return false;
        }
        
        // Filter out articles with no title
        if (!article.title || article.title.trim() === '') {
          console.log(`FILTERED (no title): ${article.url}`);
          return false;
        }
        
        // Filter out placeholder/error URLs
        const invalidPatterns = [
          'removed.com',
          'example.com',
          'localhost',
          'about:blank'
        ];
        if (invalidPatterns.some(pattern => article.url.includes(pattern))) {
          console.log(`FILTERED (invalid URL pattern): ${article.url}`);
          return false;
        }

        // Filter out biased sources
        const sourceName = article.source?.name || '';
        if (isBiasedSource(sourceName)) {
          console.log(`FILTERED (biased source): ${sourceName} - ${article.title}`);
          return false;
        }
        
        return true;
      })
      // Sort to prioritize neutral sources
      .sort((a: any, b: any) => {
        const aIsNeutral = isNeutralSource(a.source?.name || '');
        const bIsNeutral = isNeutralSource(b.source?.name || '');
        if (aIsNeutral && !bIsNeutral) return -1;
        if (!aIsNeutral && bIsNeutral) return 1;
        return 0;
      })
      // Limit to 5 articles
      .slice(0, 5)
      .map((article: any) => ({
        title: article.title,
        source: article.source?.name || "Unknown",
        url: article.url,
        publishedAt: article.publishedAt,
      }));

    console.log(`Fetched ${data.articles?.length || 0} articles, ${articles.length} after bias filtering`);

    return new Response(
      JSON.stringify({ articles }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("News API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
