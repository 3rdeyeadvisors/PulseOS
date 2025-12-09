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
    const API_KEY = Deno.env.get("EVENTBRITE_API_KEY");
    if (!API_KEY) {
      throw new Error("EVENTBRITE_API_KEY is not configured");
    }

    const { city, state, interests, radius = 50 }: EventsRequest = await req.json();

    if (!city) {
      throw new Error("City is required");
    }

    console.log(`Fetching Eventbrite events for ${city}, ${state || ''} with interests:`, interests);

    // Build location query
    const locationQuery = state ? `${city}, ${state}` : city;

    // Eventbrite uses a different approach - we search by location
    const baseUrl = "https://www.eventbriteapi.com/v3/events/search/";
    
    // Get current date for filtering
    const now = new Date();
    const startDate = now.toISOString().split('.')[0] + "Z";
    
    // End date is 30 days from now
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const endDateStr = endDate.toISOString().split('.')[0] + "Z";

    const params = new URLSearchParams({
      "location.address": locationQuery,
      "location.within": `${radius}mi`,
      "start_date.range_start": startDate,
      "start_date.range_end": endDateStr,
      "sort_by": "date",
      "expand": "venue,category,format",
    });

    // Map interests to Eventbrite categories
    const interestToCategoryMap: Record<string, string[]> = {
      "music": ["103"], // Music category
      "food": ["110"], // Food & Drink
      "tech": ["102"], // Science & Tech
      "art": ["105"], // Performing & Visual Arts
      "sports": ["108"], // Sports & Fitness
      "fitness": ["108"], // Sports & Fitness
      "business": ["101"], // Business & Professional
      "networking": ["101"],
      "comedy": ["104"], // Film, Media & Entertainment
      "movies": ["104"],
      "family": ["115"], // Family & Education
      "charity": ["111"], // Charity & Causes
      "community": ["113"], // Community & Culture
      "fashion": ["106"], // Fashion & Beauty
      "health": ["107"], // Health & Wellness
      "nightlife": ["103"], // Music (covers clubs/parties)
      "gaming": ["109"], // Hobbies & Special Interest
    };

    // Add category filter if interests provided
    const validInterests = interests?.filter(i => i && i.toLowerCase() !== 'none') || [];
    const categoryIds: string[] = [];
    
    validInterests.forEach(interest => {
      const categories = interestToCategoryMap[interest.toLowerCase()];
      if (categories) {
        categoryIds.push(...categories);
      }
    });

    // Remove duplicates
    const uniqueCategories = [...new Set(categoryIds)];
    if (uniqueCategories.length > 0) {
      params.append("categories", uniqueCategories.join(","));
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log("Fetching from Eventbrite:", url.replace(API_KEY, "***"));

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Eventbrite API error:", response.status, errorText);
      
      // If authentication fails, return empty array instead of error
      if (response.status === 401) {
        console.log("Eventbrite API key may be invalid or expired");
        return new Response(
          JSON.stringify({ 
            success: true,
            events: [],
            message: "Eventbrite integration pending authentication"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Eventbrite API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Eventbrite response received, events:", data.events?.length || 0);

    const events = data.events || [];

    // Format events to match our standard format
    const formattedEvents = events.map((event: any) => {
      const venue = event.venue;
      const startDate = event.start;
      
      // Format date
      let dateStr = "TBA";
      let timeStr = "TBA";
      let rawDate = "9999-99-99";
      
      if (startDate?.local) {
        const date = new Date(startDate.local);
        dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        rawDate = startDate.local.split('T')[0];
      }

      // Get price info
      let priceStr = "Free";
      if (event.is_free === false) {
        priceStr = "See Tickets";
      }

      // Determine match reason based on category
      let matchReason = "";
      let isInterestMatch = false;
      
      if (event.category?.name && validInterests.length > 0) {
        const categoryName = event.category.name.toLowerCase();
        const matchedInterest = validInterests.find(i => 
          categoryName.includes(i.toLowerCase()) || 
          Object.entries(interestToCategoryMap).some(([key, cats]) => 
            key === i.toLowerCase() && cats.includes(event.category_id)
          )
        );
        
        if (matchedInterest) {
          matchReason = `Based on your interest in ${matchedInterest}`;
          isInterestMatch = true;
        }
      }

      // Build address
      let address = city;
      if (venue) {
        const parts = [venue.name, venue.address?.city, venue.address?.region].filter(Boolean);
        address = parts.join(', ');
      }

      return {
        id: event.id,
        title: event.name?.text || "Untitled Event",
        type: event.category?.name || event.format?.name || "Experience",
        date: dateStr,
        rawDate,
        time: timeStr,
        location: venue?.name || "Venue TBA",
        address,
        price: priceStr,
        url: event.url,
        image: event.logo?.url || event.logo?.original?.url,
        matchReason,
        isInterestMatch,
        source: "eventbrite"
      };
    });

    // Sort by date
    formattedEvents.sort((a: any, b: any) => {
      if (a.isInterestMatch && !b.isInterestMatch) return -1;
      if (!a.isInterestMatch && b.isInterestMatch) return 1;
      return a.rawDate.localeCompare(b.rawDate);
    });

    console.log(`Returning ${formattedEvents.length} Eventbrite events`);

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
    console.error("Error in eventbrite-events function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        events: [],
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 200, // Return 200 with empty events so app doesn't break
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
