import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const dietaryOptions = [
  { value: 'none', label: 'No Restrictions', emoji: '🍽️' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'gluten-free', label: 'Gluten-Free', emoji: '🌾' },
  { value: 'dairy-free', label: 'Dairy-Free', emoji: '🥛' },
  { value: 'keto', label: 'Keto', emoji: '🥑' },
  { value: 'halal', label: 'Halal', emoji: '☪️' },
  { value: 'kosher', label: 'Kosher', emoji: '✡️' },
];

const interestOptions = [
  { value: 'movies', label: 'Movies & TV', emoji: '🎬' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'reading', label: 'Reading', emoji: '📚' },
  { value: 'cooking', label: 'Cooking', emoji: '👨‍🍳' },
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
  { value: 'gaming', label: 'Gaming', emoji: '🎮' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'tech', label: 'Technology', emoji: '💻' },
  { value: 'art', label: 'Art & Design', emoji: '🎨' },
  { value: 'nature', label: 'Nature', emoji: '🌿' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'podcasts', label: 'Podcasts', emoji: '🎙️' },
];

export function TasteTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPreferences() {
      if (!user) return;

      const { data } = await supabase
        .from('preferences')
        .select('dietary_preferences, interests')
        .eq('user_id', user.id)
        .single();

      if (data) {
        // Normalize to lowercase for consistent comparison with option values
        const normalizedDietary = (data.dietary_preferences || [])
          .map((d: string) => d.toLowerCase())
          .filter((d: string) => d !== 'none');
        const normalizedInterests = (data.interests || [])
          .map((i: string) => i.toLowerCase());
        
        setDietaryPreferences(normalizedDietary);
        setInterests(normalizedInterests);
      }
      setLoading(false);
    }

    fetchPreferences();
  }, [user]);

  const toggleDietary = (value: string) => {
    setDietaryPreferences((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const toggleInterest = (value: string) => {
    setInterests((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('preferences')
      .update({
        dietary_preferences: dietaryPreferences,
        interests,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to save taste preferences');
    } else {
      toast.success('Taste preferences saved');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taste & Interests</CardTitle>
        <CardDescription>Tell us what you like for better recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <h3 className="font-medium">Dietary Preferences</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {dietaryOptions.map((option) => {
              const isSelected = dietaryPreferences.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleDietary(option.value)}
                  className={cn(
                    'relative p-3 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  )}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <p className="text-sm font-medium mt-1">{option.label}</p>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Interests</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {interestOptions.map((option) => {
              const isSelected = interests.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleInterest(option.value)}
                  className={cn(
                    'relative p-3 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  )}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <p className="text-sm font-medium mt-1">{option.label}</p>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
