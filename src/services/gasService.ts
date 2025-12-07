import { supabase } from "@/integrations/supabase/client";

export interface GasStation {
  id: string;
  name: string;
  address: string;
  distance: string;
  price: number | null;
  priceChange: 'up' | 'down' | 'same';
}

export async function getGasPrices(lat: number, lng: number, city?: string, state?: string): Promise<{ stations: GasStation[]; note?: string }> {
  try {
    console.log(`Fetching gas prices for lat: ${lat}, lng: ${lng}, state: ${state}`);

    const { data, error } = await supabase.functions.invoke('gas-prices', {
      body: { lat, lng, city, state }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Failed to fetch gas prices');

    return {
      stations: data.stations || [],
      note: data.note
    };
  } catch (err) {
    console.error('Error fetching gas prices:', err);
    return {
      stations: getMockGasPrices(city || 'Your Area'),
      note: 'Prices vary by region'
    };
  }
}

function getMockGasPrices(city: string): GasStation[] {
  return [
    { id: '1', name: 'Costco Gas', address: `123 Main St, ${city}`, distance: '0.8 mi', price: 3.29, priceChange: 'down' },
    { id: '2', name: 'Shell', address: `456 Oak Ave, ${city}`, distance: '1.2 mi', price: 3.45, priceChange: 'same' },
    { id: '3', name: 'Chevron', address: `789 Pine Rd, ${city}`, distance: '1.5 mi', price: 3.52, priceChange: 'up' },
  ];
}
