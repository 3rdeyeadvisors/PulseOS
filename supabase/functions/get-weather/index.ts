import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { city } = await req.json();
    const apiKey = Deno.env.get("OPENWEATHER_API_KEY");

    if (!apiKey) {
      throw new Error("OpenWeather API key not configured");
    }

    const cityName = city || "New York";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=imperial`;

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch weather");
    }

    const data = await response.json();

    const weatherCondition = data.weather?.[0]?.main || "Clear";
    const temp = Math.round(data.main?.temp || 70);

    return new Response(
      JSON.stringify({
        temp,
        condition: weatherCondition,
        location: data.name || cityName,
        description: data.weather?.[0]?.description || "",
        humidity: data.main?.humidity || 0,
        windSpeed: Math.round(data.wind?.speed || 0),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Weather API error:", error);
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
