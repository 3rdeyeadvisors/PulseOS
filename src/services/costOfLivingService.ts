// Mock service for cost of living insights
interface CostInsight {
  category: string;
  averageCost: number;
  yourSpend?: number;
  trend: 'up' | 'down' | 'stable';
  tip: string;
}

export async function getCostInsights(city: string): Promise<CostInsight[]> {
  await new Promise((r) => setTimeout(r, 300));
  
  return [
    { category: 'Groceries', averageCost: 450, trend: 'up', tip: 'Shop at Costco for bulk savings' },
    { category: 'Gas', averageCost: 180, trend: 'down', tip: 'Fill up on Tuesdays for best prices' },
    { category: 'Dining Out', averageCost: 320, trend: 'stable', tip: 'Try lunch specials instead of dinner' },
    { category: 'Utilities', averageCost: 150, trend: 'up', tip: 'Smart thermostat can save 10%' },
    { category: 'Entertainment', averageCost: 100, trend: 'stable', tip: 'Check for free local events' },
  ];
}

interface BudgetSuggestion {
  title: string;
  savings: string;
  description: string;
}

export async function getBudgetSuggestions(): Promise<BudgetSuggestion[]> {
  await new Promise((r) => setTimeout(r, 200));
  
  return [
    { title: 'Switch to Generic Brands', savings: '$50/mo', description: 'Same quality, lower price on household items' },
    { title: 'Meal Prep Sundays', savings: '$120/mo', description: 'Reduce dining out by cooking in batches' },
    { title: 'Cancel Unused Subscriptions', savings: '$30/mo', description: 'Audit your monthly subscriptions' },
  ];
}
