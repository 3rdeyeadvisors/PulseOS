import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      // Add language filter for English results
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${apiKey}`;
    } else {
      // Fallback to top headlines for the user's country
      url = `https://newsapi.org/v2/top-headlines?country=${countryCode}&pageSize=5&apiKey=${apiKey}`;
    }

    console.log("Fetching news from:", url.replace(apiKey, "***"));

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("NewsAPI error:", errorData);
      throw new Error(errorData.message || "Failed to fetch news");
    }

    const data = await response.json();

    // Filter and validate articles - only include those with valid URLs
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
        
        return true;
      })
      .map((article: any) => ({
        title: article.title,
        source: article.source?.name || "Unknown",
        url: article.url,
        publishedAt: article.publishedAt,
      }));

    console.log(`Fetched ${data.articles?.length || 0} articles, ${articles.length} after filtering`);

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
