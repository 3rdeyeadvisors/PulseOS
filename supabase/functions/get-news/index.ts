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
    const { interests, country, city } = await req.json();
    const apiKey = Deno.env.get("NEWS_API_KEY");

    if (!apiKey) {
      throw new Error("NEWS_API_KEY not configured");
    }

    // Build query based on user interests and city
    let url: string;
    
    // Combine city and interests for more relevant results
    const queryParts: string[] = [];
    
    if (city) {
      queryParts.push(city);
    }
    
    if (interests && interests.length > 0) {
      queryParts.push(...interests.slice(0, 2));
    }

    if (queryParts.length > 0) {
      // Use everything endpoint with location + interest-based query
      const query = queryParts.join(" OR ");
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;
    } else {
      // Use top headlines for general news
      const countryCode = country?.toLowerCase().slice(0, 2) || 'us';
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

    const articles = data.articles?.map((article: any) => ({
      title: article.title,
      source: article.source?.name || "Unknown",
      url: article.url,
      publishedAt: article.publishedAt,
    })) || [];

    console.log(`Fetched ${articles.length} articles`);

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
