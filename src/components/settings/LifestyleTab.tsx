import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

const householdTypes = [
  { value: 'living-alone', label: 'Living Alone' },
  { value: 'couple', label: 'Couple' },
  { value: 'family-young', label: 'Family with Young Kids' },
  { value: 'family-teens', label: 'Family with Teens' },
  { value: 'roommates', label: 'Roommates' },
  { value: 'multi-gen', label: 'Multi-generational' },
];

const ageRanges = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55-64', label: '55-64' },
  { value: '65+', label: '65+' },
];

export function LifestyleTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [householdType, setHouseholdType] = useState('');
  const [ageRange, setAgeRange] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('city, state, zip_code, country, household_type, age_range')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setCity(data.city || '');
        setState(data.state || '');
        setZipCode(data.zip_code || '');
        setCountry(data.country || '');
        setHouseholdType(data.household_type || '');
        setAgeRange(data.age_range || '');
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        city,
        state,
        zip_code: zipCode,
        country,
        household_type: householdType,
        age_range: ageRange,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to save lifestyle settings');
    } else {
      toast.success('Lifestyle settings saved');
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
        <CardTitle>Lifestyle</CardTitle>
        <CardDescription>Help us personalize your experience based on your lifestyle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., San Antonio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g., Texas"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP / Postal Code</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="e.g., 78201"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">For more accurate local results</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., United States"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Household Type</Label>
            <Select value={householdType} onValueChange={setHouseholdType}>
              <SelectTrigger>
                <SelectValue placeholder="Select household type" />
              </SelectTrigger>
              <SelectContent>
                {householdTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Age Range</Label>
            <Select value={ageRange} onValueChange={setAgeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select age range" />
              </SelectTrigger>
              <SelectContent>
                {ageRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
