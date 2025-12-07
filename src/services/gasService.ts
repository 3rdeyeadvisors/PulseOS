import { supabase } from "@/integrations/supabase/client";

interface GasStation {
  id: string;
  name: string;
  address: string;
  distance: string;
  price: number;
  priceChange: 'up' | 'down' | 'same';
}

interface GasPriceData {
  stateAverage: {
    name: string;
    gasoline: number;
    midGrade: number;
    premium: number;
    diesel: number;
    currency: string;
  };
  cities: Array<{
    name: string;
    gasoline: number;
    midGrade: number;
    premium: number;
    diesel: number;
    currency: string;
  }>;
  userCity?: {
    name: string;
    gasoline: number;
    midGrade: number;
    premium: number;
    diesel: number;
    currency: string;
  };
}

// Map full state names to abbreviations
const stateAbbreviations: Record<string, string> = {
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

function getStateCode(state: string): string {
  const normalized = state.toLowerCase().trim();
  // Check if it's already an abbreviation
  if (normalized.length === 2) {
    return normalized.toUpperCase();
  }
  return stateAbbreviations[normalized] || state.toUpperCase().slice(0, 2);
}

export async function getGasPrices(city: string, state?: string): Promise<GasStation[]> {
  try {
    if (!state) {
      console.log('No state provided, using mock data');
      return getMockGasPrices(city);
    }

    const stateCode = getStateCode(state);
    console.log(`Fetching gas prices for ${city}, ${stateCode}`);

    const { data, error } = await supabase.functions.invoke('gas-prices', {
      body: { state: stateCode, city }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Failed to fetch gas prices');

    const priceData = data as GasPriceData;
    
    // Use user's city prices if available, otherwise use state average
    const basePrice = priceData.userCity?.gasoline || priceData.stateAverage.gasoline;
    
    // Create gas station entries from city data
    const stations: GasStation[] = [];

    // Add nearby cities as "stations" with their actual prices
    priceData.cities.slice(0, 4).forEach((cityData, index) => {
      const priceDiff = cityData.gasoline - basePrice;
      let priceChange: 'up' | 'down' | 'same' = 'same';
      if (priceDiff > 0.02) priceChange = 'up';
      else if (priceDiff < -0.02) priceChange = 'down';

      stations.push({
        id: `city-${index}`,
        name: `${cityData.name} Area`,
        address: `${cityData.name}, ${priceData.stateAverage.name}`,
        distance: `${(Math.random() * 15 + 2).toFixed(1)} mi`,
        price: cityData.gasoline,
        priceChange
      });
    });

    // Sort by price (cheapest first)
    stations.sort((a, b) => a.price - b.price);

    return stations;
  } catch (err) {
    console.error('Error fetching gas prices:', err);
    return getMockGasPrices(city);
  }
}

export async function getStateGasAverage(state: string): Promise<{
  regular: number;
  midGrade: number;
  premium: number;
  diesel: number;
} | null> {
  try {
    const stateCode = getStateCode(state);
    
    const { data, error } = await supabase.functions.invoke('gas-prices', {
      body: { state: stateCode }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    return {
      regular: data.stateAverage.gasoline,
      midGrade: data.stateAverage.midGrade,
      premium: data.stateAverage.premium,
      diesel: data.stateAverage.diesel
    };
  } catch (err) {
    console.error('Error fetching state gas average:', err);
    return null;
  }
}

function getMockGasPrices(city: string): GasStation[] {
  return [
    { id: '1', name: 'Costco Gas', address: `123 Main St, ${city}`, distance: '0.8 mi', price: 3.29, priceChange: 'down' },
    { id: '2', name: 'Shell', address: `456 Oak Ave, ${city}`, distance: '1.2 mi', price: 3.45, priceChange: 'same' },
    { id: '3', name: 'Chevron', address: `789 Pine Rd, ${city}`, distance: '1.5 mi', price: 3.52, priceChange: 'up' },
    { id: '4', name: 'BP', address: `321 Elm St, ${city}`, distance: '2.1 mi', price: 3.38, priceChange: 'down' },
  ];
}
