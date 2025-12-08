import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2, Utensils, MapPin, Calendar, Star, Navigation } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFoodPlaces, getThingsToDo, getEvents } from '@/services/placesService';

// Helper function to open location in maps
const openInMaps = (address: string, name: string) => {
  // Encode the address for URL
  const query = encodeURIComponent(`${name}, ${address}`);
  
  // Use universal Google Maps URL - works on both mobile (opens app) and desktop (opens web)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  
  window.open(mapsUrl, '_blank');
};

export default function OutAndAbout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [foodPlaces, setFoodPlaces] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Refetch data whenever the page becomes visible (handles navigation back from settings)
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      if (!user) return;

      setDataLoading(true);
      try {
        // Always fetch fresh preferences data
        const [{ data: profile }, { data: prefs }] = await Promise.all([
          supabase.from('profiles').select('city, state, zip_code').eq('user_id', user.id).maybeSingle(),
          supabase.from('preferences').select('dietary_preferences, interests').eq('user_id', user.id).maybeSingle(),
        ]);

        if (!isMounted) return;

        const location = {
          city: profile?.city || 'New York',
          state: profile?.state || '',
          zipCode: profile?.zip_code || '',
        };
        
        // Filter out "none" and empty values from dietary preferences
        const rawDiet = (prefs?.dietary_preferences as string[]) || [];
        const diet = rawDiet.filter(d => d && d.toLowerCase() !== 'none');
        
        const interests = (prefs?.interests as string[]) || [];

        console.log('Fetching with preferences - Diet:', diet, 'Interests:', interests);

        const [food, things, evts] = await Promise.all([
          getFoodPlaces(diet, location),
          getThingsToDo(interests, location),
          getEvents(location, interests),
        ]);

        if (!isMounted) return;

        setFoodPlaces(food);
        setActivities(things);
        setEvents(evts);
      } catch (err) {
        console.error('Out and about error:', err);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    }

    fetchData();

    // Re-fetch when the page becomes visible (e.g., user navigates back from settings)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const PlaceCard = ({ place }: { place: any }) => (
    <button
      onClick={() => openInMaps(place.address, place.name)}
      className="w-full text-left p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold group-hover:text-primary transition-colors">{place.name}</h3>
          <p className="text-sm text-muted-foreground">{place.cuisine || place.type} · {place.priceRange}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> {place.rating}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {place.distance}
            </span>
          </div>
          {place.matchReason && (
            <p className="text-xs text-primary mt-2">{place.matchReason}</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Navigation className="h-4 w-4 text-primary" />
        </div>
      </div>
    </button>
  );

  const EventCard = ({ event }: { event: any }) => (
    <div className="w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10 text-center shrink-0">
          <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-xs font-medium">{event.date}</p>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{event.title}</h3>
          <p className="text-sm text-muted-foreground">{event.time} · {event.location}</p>
          {event.matchReason && (
            <p className="text-xs text-primary mt-1">{event.matchReason}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {event.price}
              </a>
            )}
            <button
              onClick={() => openInMaps(event.address, event.location)}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <Navigation className="h-3 w-3" /> Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Out & About</h1>
          <p className="text-muted-foreground">Places, activities & events near you</p>
        </div>

        <Tabs defaultValue="food" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="food">
              <Utensils className="h-4 w-4 mr-1" /> Eat
            </TabsTrigger>
            <TabsTrigger value="do">
              <MapPin className="h-4 w-4 mr-1" /> Do
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-1" /> Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="food" className="mt-4 space-y-3">
            {dataLoading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : (
              foodPlaces.map((place) => <PlaceCard key={place.id} place={place} />)
            )}
          </TabsContent>

          <TabsContent value="do" className="mt-4 space-y-3">
            {dataLoading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : (
              activities.map((place) => <PlaceCard key={place.id} place={place} />)
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4 space-y-3">
            {dataLoading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No events found in your area</p>
                <p className="text-sm">Try expanding your search radius in settings</p>
              </div>
            ) : (
              events.map((event) => <EventCard key={event.id} event={event} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
