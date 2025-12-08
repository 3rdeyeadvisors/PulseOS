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

    // Build the API URL - search without keyword filters to get more results
    const baseUrl = "https://app.ticketmaster.com/discovery/v2/events.json";
    const params = new URLSearchParams({
      apikey: API_KEY,
      city: city,
      radius: radius.toString(),
      unit: "miles",
      size: "20", // Request more events
      sort: "date,asc"
    });

    // Add state if provided
    if (state) {
      params.append("stateCode", getStateCode(state));
    }

    // Don't filter by interests - get all events and let the user browse

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

    // Keywords to filter out internal/sponsor events
    const internalKeywords = [
      'sponsor', 'guest pass', 'voucher', 'access pass', 'courtside exp',
      'frost club', 's&b guest', 'home guest', 'visiting guest', 'team announcement',
      'premium experience', 'vip experience', 'suite', 'hospitality', 'corporate',
      'employee', 'internal', 'staff only', 'private event', 'credential',
      'media pass', 'press pass', 'comp ticket', 'complimentary'
    ];

    // Filter and format the events
    const formattedEvents = events
      .filter((event: any) => {
        const eventName = (event.name || "").toLowerCase();
        
        // Filter out internal/sponsor events
        const isInternal = internalKeywords.some(keyword => eventName.includes(keyword));
        if (isInternal) {
          console.log(`Filtering out internal event: ${event.name}`);
          return false;
        }

        // Check for valid ticket URL - only include events with real purchasable tickets
        const hasValidUrl = (
          (event.url && event.url.startsWith('http')) ||
          (event.outlets && event.outlets[0]?.url && event.outlets[0].url.startsWith('http')) ||
          (event._links?.purchase?.href && event._links.purchase.href.startsWith('http'))
        );

        if (!hasValidUrl) {
          console.log(`Filtering out event without ticket URL: ${event.name}`);
          return false;
        }

        return true;
      })
      .map((event: any) => {
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

      // Check if event matches user interests with STRICT mappings
      const eventType = (event.classifications?.[0]?.segment?.name || "").toLowerCase();
      const eventGenre = (event.classifications?.[0]?.genre?.name || "").toLowerCase();
      const eventSubGenre = (event.classifications?.[0]?.subGenre?.name || "").toLowerCase();
      const eventName = (event.name || "").toLowerCase();
      
      let matchReason = "";
      let isInterestMatch = false;
      
      // Define strict interest-to-event mappings (no overlaps)
      const interestMappings: Record<string, { segments: string[], genres: string[], keywords: string[] }> = {
        "music": { segments: ["music"], genres: ["rock", "pop", "hip-hop", "r&b", "country", "jazz", "classical", "electronic", "latin"], keywords: ["concert", "live music", "tour"] },
        "sports": { segments: ["sports"], genres: ["football", "basketball", "baseball", "hockey", "soccer", "tennis", "golf", "boxing", "mma", "wrestling"], keywords: ["game", "match", "championship"] },
        "comedy": { segments: [], genres: ["comedy"], keywords: ["comedy", "stand-up", "comedian", "funny"] },
        "theater": { segments: ["arts & theatre"], genres: ["theatre", "broadway", "musical", "play", "opera", "ballet"], keywords: ["stage", "performance"] },
        "movies": { segments: ["film"], genres: ["film", "screening", "premiere"], keywords: ["movie", "film", "cinema"] },
        "art": { segments: [], genres: ["art", "fine art", "exhibition"], keywords: ["art show", "gallery", "exhibition", "artist"] },
        "tech": { segments: [], genres: ["technology", "innovation"], keywords: ["tech", "hackathon", "startup", "developer", "coding"] },
        "gaming": { segments: [], genres: ["gaming", "esports"], keywords: ["esports", "gaming", "tournament", "video game"] },
        "food": { segments: [], genres: ["food & drink", "culinary"], keywords: ["food", "tasting", "chef", "culinary", "wine"] },
        "fitness": { segments: [], genres: ["fitness", "wellness"], keywords: ["marathon", "run", "fitness", "yoga", "workout"] },
        "nightlife": { segments: [], genres: ["club", "dance"], keywords: ["club", "party", "dj", "rave"] },
        "family": { segments: ["family"], genres: ["children", "family"], keywords: ["kids", "family", "children"] }
      };
      
      if (interests?.length) {
        const matchedInterest = interests.find(interest => {
          const interestLower = interest.toLowerCase();
          const mapping = interestMappings[interestLower];
          
          if (!mapping) {
            // Fallback: direct match only
            return eventType.includes(interestLower) || 
                   eventGenre.includes(interestLower) ||
                   eventName.includes(interestLower);
          }
          
          // Check segments
          if (mapping.segments.some(seg => eventType.includes(seg))) return true;
          // Check genres
          if (mapping.genres.some(gen => eventGenre.includes(gen) || eventSubGenre.includes(gen))) return true;
          // Check keywords in event name
          if (mapping.keywords.some(kw => eventName.includes(kw))) return true;
          
          return false;
        });
        
        if (matchedInterest) {
          matchReason = `Based on your interest in ${matchedInterest}`;
          isInterestMatch = true;
        }
      }

      // Get ticket URL - we already verified a valid URL exists in the filter
      let ticketUrl: string = event.url;
      if (!ticketUrl?.startsWith('http')) {
        ticketUrl = event.outlets?.[0]?.url || event._links?.purchase?.href;
      }

      return {
        id: event.id,
        title: event.name,
        type: event.classifications?.[0]?.segment?.name || "Event",
        date: dateStr,
        rawDate: startDate?.localDate || "9999-99-99", // For sorting
        time: timeStr,
        location: venue?.name || "Venue TBA",
        address: venue ? `${venue.name}, ${venue.city?.name || city}, ${venue.state?.stateCode || state || ''}` : city,
        price: priceStr,
        url: ticketUrl,
        image: event.images?.find((img: any) => img.ratio === "16_9")?.url || event.images?.[0]?.url,
        matchReason,
        isInterestMatch
      };
    });

    // Sort events: interest matches first, then by date (closest first)
    formattedEvents.sort((a: any, b: any) => {
      if (a.isInterestMatch && !b.isInterestMatch) return -1;
      if (!a.isInterestMatch && b.isInterestMatch) return 1;
      // Sort by date ascending (closest dates first)
      return a.rawDate.localeCompare(b.rawDate);
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
