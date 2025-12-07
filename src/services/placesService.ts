// Mock service for places and events
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
}

interface LocationInfo {
  city: string;
  state?: string;
  zipCode?: string;
}

// Generate realistic random distances
const generateDistance = (min: number, max: number): string => {
  const distance = min + Math.random() * (max - min);
  return `${distance.toFixed(1)} mi`;
};

export async function getFoodPlaces(diet: string[], location: LocationInfo): Promise<Place[]> {
  await new Promise((r) => setTimeout(r, 300));
  
  const { city, state, zipCode } = location;
  const locationSuffix = zipCode ? `${city}, ${state || ''} ${zipCode}` : `${city}${state ? `, ${state}` : ''}`;
  
  return [
    { id: '1', name: 'Green Garden', type: 'Restaurant', cuisine: 'Vegetarian', priceRange: '$$', rating: 4.5, distance: generateDistance(0.3, 1.5), matchReason: 'Matches your diet', address: `123 Main St, ${locationSuffix}` },
    { id: '2', name: 'The Health Bowl', type: 'Fast Casual', cuisine: 'Healthy', priceRange: '$', rating: 4.3, distance: generateDistance(0.5, 2.0), matchReason: 'Quick & healthy', address: `456 Oak Ave, ${locationSuffix}` },
    { id: '3', name: 'Farm to Table', type: 'Restaurant', cuisine: 'American', priceRange: '$$$', rating: 4.7, distance: generateDistance(1.0, 3.0), matchReason: 'Organic options', address: `789 Elm St, ${locationSuffix}` },
    { id: '4', name: 'Spice Route', type: 'Restaurant', cuisine: 'Indian', priceRange: '$$', rating: 4.4, distance: generateDistance(1.0, 4.0), matchReason: 'Vegan menu available', address: `321 Spice Blvd, ${locationSuffix}` },
  ];
}

export async function getThingsToDo(interests: string[], location: LocationInfo): Promise<Place[]> {
  await new Promise((r) => setTimeout(r, 300));
  
  const { city, state, zipCode } = location;
  const locationSuffix = zipCode ? `${city}, ${state || ''} ${zipCode}` : `${city}${state ? `, ${state}` : ''}`;
  
  return [
    { id: '1', name: 'City Art Museum', type: 'Museum', priceRange: '$$', rating: 4.6, distance: generateDistance(1.5, 4.0), matchReason: 'Based on your interests', address: `100 Museum Way, ${locationSuffix}` },
    { id: '2', name: 'Sunset Yoga', type: 'Fitness', priceRange: '$', rating: 4.8, distance: generateDistance(0.2, 1.0), matchReason: 'Outdoor wellness', address: `55 Wellness Dr, ${locationSuffix}` },
    { id: '3', name: 'Jazz Club Downtown', type: 'Entertainment', priceRange: '$$', rating: 4.4, distance: generateDistance(2.0, 5.0), matchReason: 'Live music tonight', address: `200 Music Row, ${locationSuffix}` },
    { id: '4', name: 'Hiking Trail Park', type: 'Nature', priceRange: 'Free', rating: 4.9, distance: generateDistance(4.0, 8.0), matchReason: 'Great weather today', address: `Trail Head Rd, ${locationSuffix}` },
  ];
}

export async function getEvents(location: LocationInfo, interests: string[]): Promise<Event[]> {
  await new Promise((r) => setTimeout(r, 300));
  
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
