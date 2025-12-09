import { supabase } from "@/integrations/supabase/client";

interface Place {
  id: string;
  name: string;
  type: string;
  cuisine?: string;
  priceRange: string;
  rating: number;
  distance: string;
  matchReason: string;
  address: string;
}

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  address: string;
  price: string;
  url?: string;
  image?: string;
  matchReason?: string;
  isInterestMatch?: boolean;
  rawDate?: string;
  source?: 'ticketmaster' | 'eventbrite';
}

interface LocationInfo {
  city: string;
  state?: string;
  zipCode?: string;
}

// Cache for geocoded coordinates
let geocodeCache: { [key: string]: { latitude: number; longitude: number } } = {};

async function getCoordinates(location: LocationInfo): Promise<{ latitude: number; longitude: number }> {
  const cacheKey = `${location.city}-${location.state || ''}-${location.zipCode || ''}`;
  
  if (geocodeCache[cacheKey]) {
    return geocodeCache[cacheKey];
  }

  try {
    const { data, error } = await supabase.functions.invoke('geocode', {
      body: {
        city: location.city,
        state: location.state,
        zipCode: location.zipCode
      }
    });

    if (error) throw error;
    
    const coords = { latitude: data.latitude, longitude: data.longitude };
    geocodeCache[cacheKey] = coords;
    return coords;
  } catch (err) {
    console.error('Geocoding error:', err);
    // Fallback to NYC coordinates
    return { latitude: 40.7128, longitude: -74.0060 };
  }
}

export async function getFoodPlaces(diet: string[], location: LocationInfo): Promise<Place[]> {
  try {
    const coords = await getCoordinates(location);
    
    const { data, error } = await supabase.functions.invoke('google-places', {
      body: {
        type: 'food',
        latitude: coords.latitude,
        longitude: coords.longitude,
        dietary: diet,
        radius: 8000 // 5 miles in meters
      }
    });

    if (error) throw error;
    
    return data.places || [];
  } catch (err) {
    console.error('Error fetching food places:', err);
    return getMockFoodPlaces(location);
  }
}

export async function getThingsToDo(interests: string[], location: LocationInfo): Promise<Place[]> {
  try {
    const coords = await getCoordinates(location);
    
    const { data, error } = await supabase.functions.invoke('google-places', {
      body: {
        type: 'activities',
        latitude: coords.latitude,
        longitude: coords.longitude,
        interests: interests,
        radius: 16000 // 10 miles in meters
      }
    });

    if (error) throw error;
    
    return data.places || [];
  } catch (err) {
    console.error('Error fetching activities:', err);
    return getMockActivities(location);
  }
}

export async function getEvents(location: LocationInfo, interests: string[]): Promise<Event[]> {
  try {
    // Filter out "none" and empty values from interests
    const validInterests = interests.filter(i => i && i.toLowerCase() !== 'none');
    
    // Get user's timezone for accurate time filtering
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Fetch from both Ticketmaster and Eventbrite in parallel
    const [ticketmasterResult, eventbriteResult] = await Promise.allSettled([
      supabase.functions.invoke('ticketmaster-events', {
        body: {
          city: location.city,
          state: location.state,
          interests: validInterests,
          radius: 100,
          timezone: userTimezone
        }
      }),
      supabase.functions.invoke('eventbrite-events', {
        body: {
          city: location.city,
          state: location.state,
          interests: validInterests,
          radius: 50
        }
      })
    ]);

    let allEvents: Event[] = [];

    // Process Ticketmaster results
    if (ticketmasterResult.status === 'fulfilled' && ticketmasterResult.value.data?.success) {
      const tmEvents = ticketmasterResult.value.data.events || [];
      allEvents.push(...tmEvents.map((e: any) => ({ ...e, source: 'ticketmaster' })));
    }

    // Process Eventbrite results
    if (eventbriteResult.status === 'fulfilled' && eventbriteResult.value.data?.success) {
      const ebEvents = eventbriteResult.value.data.events || [];
      allEvents.push(...ebEvents.map((e: any) => ({ ...e, source: 'eventbrite' })));
    }

    // Dedupe by title (case-insensitive) and sort by date
    const seen = new Set<string>();
    const uniqueEvents = allEvents.filter(event => {
      const key = event.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort: interest matches first, then by date
    uniqueEvents.sort((a: any, b: any) => {
      if (a.isInterestMatch && !b.isInterestMatch) return -1;
      if (!a.isInterestMatch && b.isInterestMatch) return 1;
      return (a.rawDate || '9999-99-99').localeCompare(b.rawDate || '9999-99-99');
    });
    
    console.log(`Fetched ${uniqueEvents.length} total events (TM: ${ticketmasterResult.status === 'fulfilled' ? ticketmasterResult.value.data?.events?.length || 0 : 0}, EB: ${eventbriteResult.status === 'fulfilled' ? eventbriteResult.value.data?.events?.length || 0 : 0})`);
    
    return uniqueEvents;
  } catch (err) {
    console.error('Error fetching events:', err);
    return []; // Return empty array instead of mock data
  }
}

// Fallback mock data functions
function getMockFoodPlaces(location: LocationInfo): Place[] {
  const { city, state, zipCode } = location;
  const locationSuffix = zipCode ? `${city}, ${state || ''} ${zipCode}` : `${city}${state ? `, ${state}` : ''}`;
  const generateDistance = (min: number, max: number): string => {
    const distance = min + Math.random() * (max - min);
    return `${distance.toFixed(1)} mi`;
  };
  
  return [
    { id: '1', name: 'Green Garden', type: 'Restaurant', cuisine: 'Vegetarian', priceRange: '$$', rating: 4.5, distance: generateDistance(0.3, 1.5), matchReason: 'Matches your diet', address: `123 Main St, ${locationSuffix}` },
    { id: '2', name: 'The Health Bowl', type: 'Fast Casual', cuisine: 'Healthy', priceRange: '$', rating: 4.3, distance: generateDistance(0.5, 2.0), matchReason: 'Quick & healthy', address: `456 Oak Ave, ${locationSuffix}` },
    { id: '3', name: 'Farm to Table', type: 'Restaurant', cuisine: 'American', priceRange: '$$$', rating: 4.7, distance: generateDistance(1.0, 3.0), matchReason: 'Organic options', address: `789 Elm St, ${locationSuffix}` },
    { id: '4', name: 'Spice Route', type: 'Restaurant', cuisine: 'Indian', priceRange: '$$', rating: 4.4, distance: generateDistance(1.0, 4.0), matchReason: 'Vegan menu available', address: `321 Spice Blvd, ${locationSuffix}` },
  ];
}

function getMockActivities(location: LocationInfo): Place[] {
  const { city, state, zipCode } = location;
  const locationSuffix = zipCode ? `${city}, ${state || ''} ${zipCode}` : `${city}${state ? `, ${state}` : ''}`;
  const generateDistance = (min: number, max: number): string => {
    const distance = min + Math.random() * (max - min);
    return `${distance.toFixed(1)} mi`;
  };
  
  return [
    { id: '1', name: 'City Art Museum', type: 'Museum', priceRange: '$$', rating: 4.6, distance: generateDistance(1.5, 4.0), matchReason: 'Based on your interests', address: `100 Museum Way, ${locationSuffix}` },
    { id: '2', name: 'Sunset Yoga', type: 'Fitness', priceRange: '$', rating: 4.8, distance: generateDistance(0.2, 1.0), matchReason: 'Outdoor wellness', address: `55 Wellness Dr, ${locationSuffix}` },
    { id: '3', name: 'Jazz Club Downtown', type: 'Entertainment', priceRange: '$$', rating: 4.4, distance: generateDistance(2.0, 5.0), matchReason: 'Live music tonight', address: `200 Music Row, ${locationSuffix}` },
    { id: '4', name: 'Hiking Trail Park', type: 'Nature', priceRange: 'Free', rating: 4.9, distance: generateDistance(4.0, 8.0), matchReason: 'Great weather today', address: `Trail Head Rd, ${locationSuffix}` },
  ];
}

function getMockEvents(location: LocationInfo): Event[] {
  const { city, state, zipCode } = location;
  const locationSuffix = zipCode ? `${city}, ${state || ''} ${zipCode}` : `${city}${state ? `, ${state}` : ''}`;
  
  const today = new Date();
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  return [
    { id: '1', title: 'Food Truck Festival', type: 'Food', date: formatDate(today), time: '11:00 AM', location: 'Downtown Plaza', address: `Downtown Plaza, ${locationSuffix}`, price: 'Free Entry' },
    { id: '2', title: 'Live Jazz Night', type: 'Music', date: formatDate(new Date(today.getTime() + 86400000)), time: '8:00 PM', location: 'Blue Note Club', address: `Blue Note Club, ${locationSuffix}`, price: '$25' },
    { id: '3', title: 'Farmers Market', type: 'Shopping', date: formatDate(new Date(today.getTime() + 172800000)), time: '9:00 AM', location: 'City Square', address: `City Square, ${locationSuffix}`, price: 'Free' },
    { id: '4', title: 'Tech Meetup', type: 'Networking', date: formatDate(new Date(today.getTime() + 259200000)), time: '6:30 PM', location: 'Innovation Hub', address: `Innovation Hub, ${locationSuffix}`, price: 'Free' },
  ];
}
