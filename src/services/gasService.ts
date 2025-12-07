// Mock service for gas prices
interface GasStation {
  id: string;
  name: string;
  address: string;
  distance: string;
  price: number;
  priceChange: 'up' | 'down' | 'same';
}

export async function getGasPrices(city: string): Promise<GasStation[]> {
  await new Promise((r) => setTimeout(r, 300));
  
  return [
    { id: '1', name: 'Costco Gas', address: '123 Main St', distance: '0.8 mi', price: 3.29, priceChange: 'down' },
    { id: '2', name: 'Shell', address: '456 Oak Ave', distance: '1.2 mi', price: 3.45, priceChange: 'same' },
    { id: '3', name: 'Chevron', address: '789 Pine Rd', distance: '1.5 mi', price: 3.52, priceChange: 'up' },
    { id: '4', name: 'BP', address: '321 Elm St', distance: '2.1 mi', price: 3.38, priceChange: 'down' },
  ];
}
