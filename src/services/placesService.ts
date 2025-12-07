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

export async function getFoodPlaces(diet: string[], city: string): Promise<Place[]> {
  await new Promise((r) => setTimeout(r, 300));
  
  return [
    { id: '1', name: 'Green Garden', type: 'Restaurant', cuisine: 'Vegetarian', priceRange: '$$', rating: 4.5, distance: '0.5 mi', matchReason: 'Matches your diet', address: `123 Main St, ${city}` },
    { id: '2', name: 'The Health Bowl', type: 'Fast Casual', cuisine: 'Healthy', priceRange: '$', rating: 4.3, distance: '0.8 mi', matchReason: 'Quick & healthy', address: `456 Oak Ave, ${city}` },
    { id: '3', name: 'Farm to Table', type: 'Restaurant', cuisine: 'American', priceRange: '$$$', rating: 4.7, distance: '1.2 mi', matchReason: 'Organic options', address: `789 Elm St, ${city}` },
    { id: '4', name: 'Spice Route', type: 'Restaurant', cuisine: 'Indian', priceRange: '$$', rating: 4.4, distance: '1.5 mi', matchReason: 'Vegan menu available', address: `321 Spice Blvd, ${city}` },
  ];
}

export async function getThingsToDo(interests: string[], city: string): Promise<Place[]> {
  await new Promise((r) => setTimeout(r, 300));
  
  return [
    { id: '1', name: 'City Art Museum', type: 'Museum', priceRange: '$$', rating: 4.6, distance: '2.1 mi', matchReason: 'Based on your interests', address: `100 Museum Way, ${city}` },
    { id: '2', name: 'Sunset Yoga', type: 'Fitness', priceRange: '$', rating: 4.8, distance: '0.3 mi', matchReason: 'Outdoor wellness', address: `55 Wellness Dr, ${city}` },
    { id: '3', name: 'Jazz Club Downtown', type: 'Entertainment', priceRange: '$$', rating: 4.4, distance: '3.2 mi', matchReason: 'Live music tonight', address: `200 Music Row, ${city}` },
    { id: '4', name: 'Hiking Trail Park', type: 'Nature', priceRange: 'Free', rating: 4.9, distance: '5.0 mi', matchReason: 'Great weather today', address: `Trail Head Rd, ${city}` },
  ];
}

export async function getEvents(city: string, interests: string[]): Promise<Event[]> {
  await new Promise((r) => setTimeout(r, 300));
  
  const today = new Date();
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  return [
    { id: '1', title: 'Food Truck Festival', type: 'Food', date: formatDate(today), time: '11:00 AM', location: 'Downtown Plaza', address: `Downtown Plaza, ${city}`, price: 'Free Entry' },
    { id: '2', title: 'Live Jazz Night', type: 'Music', date: formatDate(new Date(today.getTime() + 86400000)), time: '8:00 PM', location: 'Blue Note Club', address: `Blue Note Club, ${city}`, price: '$25' },
    { id: '3', title: 'Farmers Market', type: 'Shopping', date: formatDate(new Date(today.getTime() + 172800000)), time: '9:00 AM', location: 'City Square', address: `City Square, ${city}`, price: 'Free' },
    { id: '4', title: 'Tech Meetup', type: 'Networking', date: formatDate(new Date(today.getTime() + 259200000)), time: '6:30 PM', location: 'Innovation Hub', address: `Innovation Hub, ${city}`, price: 'Free' },
  ];
}
