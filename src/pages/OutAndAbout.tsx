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

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        const [{ data: profile }, { data: prefs }] = await Promise.all([
          supabase.from('profiles').select('city, state, zip_code').eq('user_id', user.id).maybeSingle(),
          supabase.from('preferences').select('dietary_preferences, interests').eq('user_id', user.id).maybeSingle(),
        ]);

        const location = {
          city: profile?.city || 'New York',
          state: profile?.state || '',
          zipCode: profile?.zip_code || '',
        };
        const diet = (prefs?.dietary_preferences as string[]) || [];
        const interests = (prefs?.interests as string[]) || [];

        const [food, things, evts] = await Promise.all([
          getFoodPlaces(diet, location),
          getThingsToDo(interests, location),
          getEvents(location, interests),
        ]);

        setFoodPlaces(food);
        setActivities(things);
        setEvents(evts);
      } catch (err) {
        console.error('Out and about error:', err);
      } finally {
        setDataLoading(false);
      }
    }

    fetchData();
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
          <p className="text-xs text-primary mt-2">{place.matchReason}</p>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Navigation className="h-4 w-4 text-primary" />
        </div>
      </div>
    </button>
  );

  const EventCard = ({ event }: { event: any }) => (
    <button
      onClick={() => openInMaps(event.address, event.location)}
      className="w-full text-left p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10 text-center shrink-0">
          <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-xs font-medium">{event.date}</p>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold group-hover:text-primary transition-colors">{event.title}</h3>
          <p className="text-sm text-muted-foreground">{event.time} · {event.location}</p>
          <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-secondary">{event.price}</span>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity self-center">
          <Navigation className="h-4 w-4 text-primary" />
        </div>
      </div>
    </button>
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
            ) : (
              events.map((event) => <EventCard key={event.id} event={event} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
