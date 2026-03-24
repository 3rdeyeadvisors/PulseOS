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
  timezone?: string;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  url?: string;
  dates?: { start?: { localDate?: string; localTime?: string } };
  _embedded?: {
    venues?: Array<{
      name?: string;
      address?: { line1?: string };
      city?: { name?: string };
      state?: { stateCode?: string }
    }>;
  };
  images?: Array<{ url?: string; ratio?: string }>;
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string }
  }>;
  priceRanges?: Array<{ min?: number; max?: number; type?: string }>;
  products?: Array<{ price?: number }>;
  outlets?: Array<{ url?: string }>;
  _links?: { purchase?: { href?: string } };
  _resolvedUrl?: string;
  [key: string]: unknown;
}

interface FormattedEvent {
  id: string;
  title: string;
  type: string;
  genre: string;
  subGenre: string;
  date: string;
  rawDate: string;
  time: string;
  location: string;
  address: string;
  price: string;
  url?: string;
  image?: string;
  matchReason: string;
  isInterestMatch: boolean;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get("TICKETMASTER_API_KEY");
    if (!API_KEY) {
      throw new Error("TICKETMASTER_API_KEY is not configured");
    }

    const { city, state, interests, radius = 100, timezone = 'America/New_York' }: EventsRequest = await req.json();

    if (!city) {
      throw new Error("City is required");
    }

    // Filter out "none" and empty values from interests
    const validInterests = interests?.filter(i => i && i.toLowerCase() !== 'none') || [];

    console.log(`Fetching events for ${city}, ${state || ''} with interests:`, validInterests, `timezone: ${timezone}`);

    // Get today's date in the format required by Ticketmaster API (YYYY-MM-DDTHH:mm:ssZ)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const startDateTime = today.toISOString().replace('.000Z', 'Z');

    const baseUrl = "https://app.ticketmaster.com/discovery/v2/events.json";
    
    // Fetch events from different segments to get variety (Sports, Music, Arts, etc.)
    const segments = [
      { id: "KZFzniwnSyZfZ7v7nE", name: "Sports" },
      { id: "KZFzniwnSyZfZ7v7nJ", name: "Music" },
      { id: "KZFzniwnSyZfZ7v7na", name: "Arts & Theatre" },
      { id: "KZFzniwnSyZfZ7v7nn", name: "Film" },
      { id: "KZFzniwnSyZfZ7v7n1", name: "Miscellaneous" }
    ];

    const stateCode = state ? getStateCode(state) : '';
    
    // Fetch events from each segment in parallel
    const fetchPromises = segments.map(async (segment): Promise<TicketmasterEvent[]> => {
      const params = new URLSearchParams({
        apikey: API_KEY,
        city: city,
        radius: radius.toString(),
        unit: "miles",
        size: "20",
        sort: "date,asc",
        startDateTime: startDateTime,
        segmentId: segment.id
      });
      
      if (stateCode) {
        params.append("stateCode", stateCode);
      }

      const url = `${baseUrl}?${params.toString()}`;
      console.log(`Fetching ${segment.name} from:`, url.replace(API_KEY, "***"));

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Ticketmaster API error for ${segment.name}:`, response.status);
          return [];
        }
        const data = await response.json();
        const segmentEvents = data._embedded?.events || [];
        console.log(`${segment.name} events received:`, segmentEvents.length);
        return segmentEvents;
      } catch (err: unknown) {
        console.error(`Error fetching ${segment.name}:`, err);
        return [];
      }
    });

    const allSegmentResults = await Promise.all(fetchPromises);
    
    // Combine and deduplicate by event ID
    const seenIds = new Set<string>();
    const events: TicketmasterEvent[] = [];
    for (const segmentEvents of allSegmentResults) {
      for (const event of segmentEvents as TicketmasterEvent[]) {
        if (!seenIds.has(event.id)) {
          seenIds.add(event.id);
          events.push(event);
        }
      }
    }
    
    console.log("Total unique events after combining segments:", events.length);

    // Keywords to filter out internal/sponsor events
    const internalKeywords = [
      'sponsor', 'guest pass', 'voucher', 'access pass', 'courtside exp',
      'frost club', 's&b guest', 'home guest', 'visiting guest', 'team announcement',
      'premium experience', 'vip experience', 'suite', 'hospitality', 'corporate',
      'employee', 'internal', 'staff only', 'private event', 'credential',
      'media pass', 'press pass', 'comp ticket', 'complimentary'
    ];

    // Get current time in user's timezone for comparison
    const now = new Date();
    const userNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const todayStr = userNow.toISOString().split('T')[0];
    const currentHours = userNow.getHours();
    const currentMinutes = userNow.getMinutes();

    console.log(`Current time in ${timezone}: ${userNow.toISOString()}, ${currentHours}:${currentMinutes}`);

    // Log all events before filtering for debugging
    console.log("All events from Ticketmaster BEFORE filtering:", events.map((e: TicketmasterEvent) => ({
      name: e.name?.substring(0, 40),
      type: e.classifications?.[0]?.segment?.name,
      genre: e.classifications?.[0]?.genre?.name,
      date: e.dates?.start?.localDate,
      hasUrl: !!e.url
    })));

    // Filter and format the events
    const formattedEvents: FormattedEvent[] = events
      .filter((event) => {
        const eventName = (event.name || "").toLowerCase();
        const eventDate = event.dates?.start?.localDate;
        const eventTime = event.dates?.start?.localTime; // HH:mm:ss format
        
        // Filter out past events - check both date AND time in user's timezone
        if (eventDate) {
          if (eventDate < todayStr) {
            console.log(`FILTERED (past date): ${event.name} (${eventDate})`);
            return false;
          }
          
          // If event is today, also check the time
          if (eventDate === todayStr && eventTime) {
            const [hours, minutes] = eventTime.split(':').map(Number);
            
            // Compare event time with current time in user's timezone
            if (hours < currentHours || (hours === currentHours && minutes < currentMinutes)) {
              console.log(`FILTERED (past time): ${event.name} (${eventDate} ${eventTime})`);
              return false;
            }
          }
        }
        
        // Filter out internal/sponsor events
        const isInternal = internalKeywords.some(keyword => eventName.includes(keyword));
        if (isInternal) {
          const matchedKeyword = internalKeywords.find(kw => eventName.includes(kw));
          console.log(`FILTERED (internal - "${matchedKeyword}"): ${event.name}`);
          return false;
        }

        // Get the best available URL for this event
        const ticketUrl = 
          (typeof event.url === 'string' && event.url.startsWith('http') ? event.url : null) ||
          (event.outlets?.[0]?.url && event.outlets[0].url.startsWith('http') ? event.outlets[0].url : null) ||
          (event._links?.purchase?.href && event._links.purchase.href.startsWith('http') ? event._links.purchase.href : null) ||
          (event.id ? `https://www.ticketmaster.com/event/${event.id}` : null);

        if (!ticketUrl) {
          console.log(`FILTERED (no URL): ${event.name}`);
          return false;
        }
        
        // Store the URL on the event for later use
        event._resolvedUrl = ticketUrl;

        console.log(`KEPT: ${event.name}`);
        return true;
      })
      .map((event) => {
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

      // Get price range - check multiple sources
      let priceStr = "See Tickets";
      const priceRanges = event.priceRanges;
      
      if (priceRanges && priceRanges.length > 0) {
        // Find the best price range (prefer type "standard" if available)
        const standardPrice = priceRanges.find((p) => p.type === 'standard') || priceRanges[0];
        const min = standardPrice.min;
        const max = standardPrice.max;
        if (min && max) {
          priceStr = min === max ? `$${min}` : `$${min} - $${max}`;
        } else if (min) {
          priceStr = `From $${min}`;
        } else if (max) {
          priceStr = `Up to $${max}`;
        }
      } else if (event.products && event.products.length > 0) {
        // Fallback to products array if available
        const product = event.products[0];
        if (product.price) {
          priceStr = `$${product.price}`;
        }
      }
      
      // Log price info for debugging
      if (priceStr === "See Tickets") {
        console.log(`No price for: ${event.name} - priceRanges:`, event.priceRanges);
      }

      // Check if event matches user interests - STRICT matching only on Ticketmaster classification data
      const eventSegment = (event.classifications?.[0]?.segment?.name || "").toLowerCase();
      const eventGenre = (event.classifications?.[0]?.genre?.name || "").toLowerCase();
      const eventSubGenre = (event.classifications?.[0]?.subGenre?.name || "").toLowerCase();
      
      let matchReason = "";
      let isInterestMatch = false;
      
      // Define strict interest-to-event mappings - ONLY match on official Ticketmaster classifications
      const interestMappings: Record<string, { segments: string[], genres: string[] }> = {
        "music": { segments: ["music"], genres: ["rock", "pop", "hip-hop", "r&b", "country", "jazz", "classical", "electronic", "latin", "alternative", "metal", "indie"] },
        "sports": { segments: ["sports"], genres: ["basketball", "football", "baseball", "hockey", "soccer", "tennis", "golf", "boxing", "mma", "wrestling", "nba", "nfl", "mlb", "nhl"] },
        "comedy": { segments: [], genres: ["comedy"] },
        "theater": { segments: ["arts & theatre"], genres: ["theatre", "broadway", "musical", "play", "opera", "ballet", "dance"] },
        "movies": { segments: ["film"], genres: ["film", "screening"] },
        "art": { segments: [], genres: ["art", "fine art", "exhibition"] },
        "gaming": { segments: [], genres: ["gaming", "esports"] },
        "family": { segments: [], genres: ["children", "family", "circus", "ice shows"] }
      };
      
      if (validInterests?.length) {
        const matchedInterest = validInterests.find(interest => {
          const interestLower = interest.toLowerCase();
          const mapping = interestMappings[interestLower];
          
          if (!mapping) {
            // No mapping for this interest - don't try to match loosely
            return false;
          }
          
          // Check segments (exact match)
          if (mapping.segments.some(seg => eventSegment === seg)) return true;
          
          // Check genres (exact match or contains for compound genres like "Hip-Hop/Rap")
          if (mapping.genres.some(gen => eventGenre === gen || eventGenre.includes(gen) || eventSubGenre === gen || eventSubGenre.includes(gen))) return true;
          
          return false;
        });
        
        if (matchedInterest) {
          matchReason = `Based on your interest in ${matchedInterest}`;
          isInterestMatch = true;
        }
      }

      // Use the pre-resolved URL from the filter step
      const ticketUrl = event._resolvedUrl;

      return {
        id: event.id,
        title: event.name,
        type: event.classifications?.[0]?.segment?.name || "Event",
        genre: event.classifications?.[0]?.genre?.name || "",
        subGenre: event.classifications?.[0]?.subGenre?.name || "",
        date: dateStr,
        rawDate: startDate?.localDate || "9999-99-99", // For sorting
        time: timeStr,
        location: venue?.name || "Venue TBA",
        address: venue ? `${venue.name}, ${venue.city?.name || city}, ${venue.state?.stateCode || state || ''}` : city,
        price: priceStr,
        url: ticketUrl,
        image: event.images?.find((img) => img.ratio === "16_9")?.url || event.images?.[0]?.url,
        matchReason,
        isInterestMatch
      };
    });

    // Group events by normalized name to deduplicate recurring events
    const eventGroups = new Map<string, FormattedEvent[]>();
    formattedEvents.forEach((event) => {
      // Normalize the event name for grouping (remove dates, times, venue specifics)
      const normalizedName = event.title
        .toLowerCase()
        .replace(/\s*-\s*(night|day|week|evening|morning)\s*\d*/gi, '')
        .replace(/\s*\d{1,2}\/\d{1,2}(\/\d{2,4})?/g, '') // Remove dates like 12/25 or 12/25/24
        .replace(/\s*@\s*.*/gi, '') // Remove @ venue
        .trim();
      
      if (!eventGroups.has(normalizedName)) {
        eventGroups.set(normalizedName, []);
      }
      eventGroups.get(normalizedName)!.push(event);
    });

    // For each group, keep the soonest event and add info about additional dates
    interface DeduplicatedEvent extends FormattedEvent {
      additionalDates: number;
      allDates: Array<{
        date: string;
        time: string;
        rawDate: string;
        url?: string;
        price?: string;
      }>;
    }

    const deduplicatedEvents = Array.from(eventGroups.values()).map((group) => {
      // Sort group by date
      group.sort((a, b) => a.rawDate.localeCompare(b.rawDate));
      const soonestEvent = group[0];
      const additionalDates = group.length - 1;
      
      return {
        ...soonestEvent,
        additionalDates,
        allDates: group.map(e => ({ 
          date: e.date, 
          time: e.time, 
          rawDate: e.rawDate,
          url: e.url,
          price: e.price
        }))
      } as DeduplicatedEvent;
    });

    // Sort events: interest matches first, then by date (closest first)
    deduplicatedEvents.sort((a: DeduplicatedEvent, b: DeduplicatedEvent) => {
      if (a.isInterestMatch && !b.isInterestMatch) return -1;
      if (!a.isInterestMatch && b.isInterestMatch) return 1;
      // Sort by date ascending (closest dates first)
      return a.rawDate.localeCompare(b.rawDate);
    });

    // Log all event categories for debugging
    console.log("Event categories returned:", deduplicatedEvents.map((e) => ({
      title: e.title.substring(0, 30),
      type: e.type,
      genre: e.genre,
      subGenre: e.subGenre
    })));

    return new Response(
      JSON.stringify({ 
        success: true,
        events: deduplicatedEvents
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
