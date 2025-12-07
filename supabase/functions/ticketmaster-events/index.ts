import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventsRequest {
  city: string;
  state?: string;
  interests?: string[];
  radius?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get("TICKETMASTER_API_KEY");
    if (!API_KEY) {
      throw new Error("TICKETMASTER_API_KEY is not configured");
    }

    const { city, state, interests, radius = 50 }: EventsRequest = await req.json();

    if (!city) {
      throw new Error("City is required");
    }

    console.log(`Fetching events for ${city}, ${state || ''}`);

    // Build the API URL
    const baseUrl = "https://app.ticketmaster.com/discovery/v2/events.json";
    const params = new URLSearchParams({
      apikey: API_KEY,
      city: city,
      radius: radius.toString(),
      unit: "miles",
      size: "10",
      sort: "date,asc"
    });

    // Add state if provided
    if (state) {
      params.append("stateCode", getStateCode(state));
    }

    // Add keyword based on interests
    if (interests && interests.length > 0) {
      // Use first few interests as keywords
      const keywords = interests.slice(0, 3).join(",");
      params.append("keyword", keywords);
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log("Fetching from:", url.replace(API_KEY, "***"));

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ticketmaster API error:", response.status, errorText);
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ticketmaster response received, events:", data._embedded?.events?.length || 0);

    const events = data._embedded?.events || [];

    // Format the events
    const formattedEvents = events.map((event: any) => {
      const venue = event._embedded?.venues?.[0];
      const startDate = event.dates?.start;
      
      // Format date
      let dateStr = "TBA";
      let timeStr = "TBA";
      if (startDate?.localDate) {
        const date = new Date(startDate.localDate);
        dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
      if (startDate?.localTime) {
        const [hours, minutes] = startDate.localTime.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        timeStr = `${hour12}:${minutes} ${ampm}`;
      }

      // Get price range
      let priceStr = "See Tickets";
      const priceRanges = event.priceRanges;
      if (priceRanges && priceRanges.length > 0) {
        const min = priceRanges[0].min;
        const max = priceRanges[0].max;
        if (min && max) {
          priceStr = min === max ? `$${min}` : `$${min} - $${max}`;
        } else if (min) {
          priceStr = `From $${min}`;
        }
      }

      return {
        id: event.id,
        title: event.name,
        type: event.classifications?.[0]?.segment?.name || "Event",
        date: dateStr,
        time: timeStr,
        location: venue?.name || "Venue TBA",
        address: venue ? `${venue.name}, ${venue.city?.name || city}, ${venue.state?.stateCode || state || ''}` : city,
        price: priceStr,
        url: event.url,
        image: event.images?.find((img: any) => img.ratio === "16_9")?.url || event.images?.[0]?.url
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        events: formattedEvents
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in ticketmaster-events function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Helper to convert full state names to codes
function getStateCode(state: string): string {
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
  };
  
  const normalized = state.toLowerCase().trim();
  if (normalized.length === 2) return normalized.toUpperCase();
  return stateMap[normalized] || state.toUpperCase().slice(0, 2);
}
