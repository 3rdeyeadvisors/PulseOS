import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { InviteFriendModal } from '@/components/social/InviteFriendModal';
import { Loader2, Utensils, MapPin, Calendar, Star, Navigation, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getFoodPlaces, getThingsToDo, getEvents } from '@/services/placesService';

// Helper function to open location in maps
const openInMaps = (address: string, name: string) => {
  // Encode the address for URL
  const query = encodeURIComponent(`${name}, ${address}`);
  
  // Use universal Google Maps URL - works on both mobile (opens app) and desktop (opens web)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  
  window.open(mapsUrl, '_blank');
};

const EVENT_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'family', label: 'Family' },
];

// Helper to check if event matches category
const eventMatchesCategory = (event: any, category: string): boolean => {
  if (category === 'all') return true;
  
  const type = (event.type || '').toLowerCase();
  const genre = (event.genre || '').toLowerCase();
  const subGenre = (event.subGenre || '').toLowerCase();
  
  switch (category) {
    case 'music':
      return type === 'music';
    case 'sports':
      return type === 'sports';
    case 'theatre':
      return type === 'arts & theatre' || genre.includes('theatre') || genre.includes('broadway') || genre.includes('musical');
    case 'comedy':
      return genre.includes('comedy') || subGenre.includes('comedy');
    case 'family':
      return type === 'family' || genre.includes('family') || genre.includes('children');
    default:
      return true;
  }
};

export default function OutAndAbout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [foodPlaces, setFoodPlaces] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [eventCategory, setEventCategory] = useState('all');
  const [dataLoading, setDataLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState<{
    open: boolean;
    type: string;
    name: string;
    data: any;
  }>({ open: false, type: '', name: '', data: null });

  const filteredEvents = events.filter(e => eventMatchesCategory(e, eventCategory));

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

  const PlaceCard = ({ place, type }: { place: any; type: string }) => (
    <div className="w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between">
        <button
          onClick={() => openInMaps(place.address, place.name)}
          className="flex-1 text-left group"
        >
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
        </button>
        <div className="flex flex-col gap-2 ml-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => setInviteModal({ open: true, type, name: place.name, data: place })}
          >
            <UserPlus className="h-3 w-3" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1"
            onClick={() => openInMaps(place.address, place.name)}
          >
            <Navigation className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  const EventCard = ({ event }: { event: any }) => {
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const currentDate = event.allDates?.[selectedDateIndex] || event;
    
    const handleDateSelect = (index: number) => {
      setSelectedDateIndex(index);
      setPopoverOpen(false);
    };
    
    return (
      <div className="w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-center shrink-0">
            <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium">{currentDate.date}</p>
            {event.additionalDates > 0 && (
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="text-[10px] text-primary mt-1 hover:underline cursor-pointer">
                    +{event.additionalDates} more
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-2" align="start">
                  <p className="text-xs font-medium mb-2">Select a date:</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {event.allDates?.map((d: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleDateSelect(i)}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                          selectedDateIndex === i 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        {d.date} · {d.time}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{event.title}</h3>
            <p className="text-sm text-muted-foreground">{currentDate.time} · {event.location}</p>
            {event.matchReason && (
              <p className="text-xs text-primary mt-1">{event.matchReason}</p>
            )}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {currentDate.url && (
                <a
                  href={currentDate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {currentDate.price || event.price}
                </a>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => setInviteModal({ open: true, type: 'event', name: event.title, data: { ...event, selectedDate: currentDate } })}
              >
                <UserPlus className="h-3 w-3" />
                Invite
              </Button>
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
  };

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
              foodPlaces.map((place) => <PlaceCard key={place.id} place={place} type="restaurant" />)
            )}
          </TabsContent>

          <TabsContent value="do" className="mt-4 space-y-3">
            {dataLoading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : (
              activities.map((place) => <PlaceCard key={place.id} place={place} type="activity" />)
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4 space-y-3">
            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setEventCategory(cat.value)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                    eventCategory === cat.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            {dataLoading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{eventCategory === 'all' ? 'No events found in your area' : `No ${eventCategory} events found`}</p>
                <p className="text-sm mt-2">Try a different category or ask your AI assistant</p>
              </div>
            ) : (
              filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
            )}
          </TabsContent>
        </Tabs>
      </div>

      <InviteFriendModal
        open={inviteModal.open}
        onOpenChange={(open) => setInviteModal(prev => ({ ...prev, open }))}
        activityType={inviteModal.type}
        activityName={inviteModal.name}
        activityData={inviteModal.data}
      />
    </AppShell>
  );
}
