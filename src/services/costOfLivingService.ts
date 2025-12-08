import { supabase } from '@/integrations/supabase/client';

export interface CostInsight {
  category: string;
  averageCost: number;
  yourSpend?: number;
  trend: 'up' | 'down' | 'stable';
  tip: string;
}

export interface BudgetSuggestion {
  title: string;
  savings: string;
  description: string;
}

interface CostInsightsResponse {
  success: boolean;
  location: string;
  insights: CostInsight[];
  budgetTips: BudgetSuggestion[];
  error?: string;
}

// Cache for cost insights to avoid duplicate API calls
let cachedResponse: { key: string; data: CostInsightsResponse; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchCostInsightsData(
  city: string,
  state?: string,
  householdType?: string
): Promise<CostInsightsResponse | null> {
  const cacheKey = `${city}-${state}-${householdType}`;
  
  // Return cached data if valid
  if (cachedResponse && cachedResponse.key === cacheKey && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
    return cachedResponse.data;
  }

  try {
    const { data, error } = await supabase.functions.invoke<CostInsightsResponse>('cost-insights', {
      body: { city, state, householdType }
    });

    if (error) {
      console.error('Cost insights function error:', error);
      return null;
    }

    if (data) {
      cachedResponse = { key: cacheKey, data, timestamp: Date.now() };
      return data;
    }

    return null;
  } catch (err) {
    console.error('Cost insights error:', err);
    return null;
  }
}

export async function getCostInsights(
  city: string,
  state?: string,
  householdType?: string
): Promise<CostInsight[]> {
  const data = await fetchCostInsightsData(city, state, householdType);
  return data?.insights || getFallbackInsights();
}

export async function getBudgetSuggestions(
  city?: string,
  state?: string,
  householdType?: string
): Promise<BudgetSuggestion[]> {
  const data = await fetchCostInsightsData(city || 'United States', state, householdType);
  return data?.budgetTips || getFallbackBudgetTips();
}

// New combined function for efficient single fetch
export async function getCostInsightsWithBudget(
  city: string,
  state?: string,
  householdType?: string
): Promise<{ insights: CostInsight[]; budgetTips: BudgetSuggestion[] }> {
  const data = await fetchCostInsightsData(city, state, householdType);
  return {
    insights: data?.insights || getFallbackInsights(),
    budgetTips: data?.budgetTips || getFallbackBudgetTips()
  };
}

function getFallbackInsights(): CostInsight[] {
  return [
    { category: 'Groceries', averageCost: 450, trend: 'up', tip: 'Shop at discount stores for bulk savings' },
    { category: 'Gas', averageCost: 180, trend: 'stable', tip: 'Fill up mid-week for best prices' },
    { category: 'Dining Out', averageCost: 320, trend: 'up', tip: 'Try lunch specials instead of dinner' },
    { category: 'Utilities', averageCost: 150, trend: 'stable', tip: 'Smart thermostat can save 10%' },
    { category: 'Entertainment', averageCost: 100, trend: 'stable', tip: 'Check for free local events' },
  ];
}

function getFallbackBudgetTips(): BudgetSuggestion[] {
  return [
    { title: 'Switch to Generic Brands', savings: '$50/mo', description: 'Same quality, lower price on household items' },
    { title: 'Meal Prep Sundays', savings: '$120/mo', description: 'Reduce dining out by cooking in batches' },
    { title: 'Cancel Unused Subscriptions', savings: '$30/mo', description: 'Audit your monthly subscriptions' },
  ];
}
