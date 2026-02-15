import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationAutocomplete, AddressComponents } from '@/components/ui/location-autocomplete';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, MapPin, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const HOUSEHOLD_TYPES = ['Solo', 'Couple', 'Family', 'Roommates'];
const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];

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

  // Handle city selection - auto-fill state, country
  const handleCityAddressComponents = useCallback((components: AddressComponents) => {
    if (components.state || components.stateLong) {
      setState(components.stateLong || components.state || '');
    }
    if (components.country) {
      setCountry(components.country);
    }
    if (components.zipCode && !zipCode) {
      setZipCode(components.zipCode);
    }
  }, [zipCode]);

  // Handle zip code blur - geocode and auto-fill city, state, country
  const handleZipCodeBlur = useCallback(async () => {
    if (!zipCode || zipCode.length < 3) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: { zipCode }
      });
      
      if (error || !data?.addressComponents) return;
      
      const components = data.addressComponents;
      if (components.city && !city) {
        setCity(components.city);
      }
      if ((components.state || components.stateLong) && !state) {
        setState(components.stateLong || components.state || '');
      }
      if (components.country && !country) {
        setCountry(components.country);
      }
    } catch (err) {
      console.error('Zip code geocoding failed:', err);
    }
  }, [zipCode, city, state, country]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        city,
        state,
        zip_code: zipCode,
        country,
        household_type: householdType,
        age_range: ageRange,
        updated_at: new Date().toISOString(),
      });

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
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <LocationAutocomplete
                id="city"
                value={city}
                onValueChange={setCity}
                onAddressComponentsChange={handleCityAddressComponents}
                locationType="city"
                placeholder="e.g., San Antonio, Hope Mills"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <LocationAutocomplete
                id="state"
                value={state}
                onValueChange={setState}
                locationType="region"
                placeholder="e.g., Texas, North Carolina"
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
                onBlur={handleZipCodeBlur}
                placeholder="e.g., 78201"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">Enter to auto-fill city, state, country</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <LocationAutocomplete
                id="country"
                value={country}
                onValueChange={setCountry}
                locationType="country"
                placeholder="e.g., United States"
              />
            </div>
          </div>
        </div>

        {/* Household Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Home className="h-4 w-4" />
            Household
          </h4>
          <div className="space-y-2">
            <Label>Household Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HOUSEHOLD_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setHouseholdType(type)}
                  className={cn(
                    'px-4 py-3 rounded-lg border text-sm font-medium transition-all',
                    householdType === type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/50 border-border hover:border-primary/50'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Age Range</Label>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setAgeRange(range)}
                  className={cn(
                    'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                    ageRange === range
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/50 border-border hover:border-primary/50'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
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