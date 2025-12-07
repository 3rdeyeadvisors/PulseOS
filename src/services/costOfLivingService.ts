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

export async function getCostInsights(
  city: string,
  state?: string,
  householdType?: string
): Promise<CostInsight[]> {
  try {
    const { data, error } = await supabase.functions.invoke<CostInsightsResponse>('cost-insights', {
      body: { city, state, householdType }
    });

    if (error) {
      console.error('Cost insights function error:', error);
      return getFallbackInsights();
    }

    if (data?.insights) {
      return data.insights;
    }

    return getFallbackInsights();
  } catch (err) {
    console.error('Cost insights error:', err);
    return getFallbackInsights();
  }
}

export async function getBudgetSuggestions(
  city?: string,
  state?: string,
  householdType?: string
): Promise<BudgetSuggestion[]> {
  try {
    const { data, error } = await supabase.functions.invoke<CostInsightsResponse>('cost-insights', {
      body: { city: city || 'United States', state, householdType }
    });

    if (error) {
      console.error('Budget suggestions function error:', error);
      return getFallbackBudgetTips();
    }

    if (data?.budgetTips) {
      return data.budgetTips;
    }

    return getFallbackBudgetTips();
  } catch (err) {
    console.error('Budget suggestions error:', err);
    return getFallbackBudgetTips();
  }
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
