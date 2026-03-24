import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import { toast } from 'sonner';
import { 
  Zap, ArrowRight, ArrowLeft, Check, Loader2, 
  User, MapPin, Home, Utensils, Heart, Palette, Bot,
  SkipForward
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Zap },
  { id: 'lifestyle', title: 'Lifestyle', icon: MapPin },
  { id: 'taste', title: 'Taste', icon: Heart },
  { id: 'theme', title: 'Theme', icon: Palette },
  { id: 'ai', title: 'AI Setup', icon: Bot },
];

const HOUSEHOLD_TYPES = ['Solo', 'Couple', 'Family', 'Roommates'];
const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Halal', 'Kosher', 'None'];
const INTEREST_OPTIONS = ['Tech', 'Sports', 'Music', 'Movies', 'Gaming', 'Travel', 'Fitness', 'Cooking', 'Reading', 'Art', 'Fashion', 'Finance'];
const AI_PERSONALITIES = [
  { value: 'professional', label: 'Professional', description: 'Formal and precise' },
  { value: 'balanced', label: 'Balanced', description: 'Friendly yet informative' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'witty', label: 'Witty', description: 'Clever with a sense of humor' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [country, setCountry] = useState('');
  const [householdType, setHouseholdType] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>('night');
  const [aiName, setAiName] = useState('Pulse');
  const [aiPersonality, setAiPersonality] = useState('balanced');
  const [aiHumorLevel, setAiHumorLevel] = useState(50);
  const [aiFormalityLevel, setAiFormalityLevel] = useState(50);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Load existing profile data
    const loadProfile = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile) {
        if (profile.onboarding_completed) {
          navigate('/app');
          return;
        }
        setFullName(profile.full_name || '');
        setCity(profile.city || '');
        if (profile.state) setStateProvince(profile.state);
        setCountry(profile.country || '');
        setHouseholdType(profile.household_type || '');
        setAgeRange(profile.age_range || '');
      }

      const { data: prefs } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (prefs) {
        setDietaryPreferences(prefs.dietary_preferences || []);
        setInterests(prefs.interests || []);
        setSelectedTheme((prefs.theme as ThemeName) || 'night');
        setAiName(prefs.ai_name || 'Pulse');
        setAiPersonality(prefs.ai_personality || 'balanced');
        setAiHumorLevel(prefs.ai_humor_level || 50);
        setAiFormalityLevel(prefs.ai_formality_level || 50);
      }
    };

    loadProfile();
  }, [user, navigate]);

  const handleThemePreview = (themeName: ThemeName) => {
    setSelectedTheme(themeName);
    setTheme(themeName);
  };

  const toggleArrayItem = (arr: string[], item: string, setter: (val: string[]) => void) => {
    if (arr.includes(item)) {
      setter(arr.filter(i => i !== item));
    } else {
      setter([...arr, item]);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName,
          city,
          state: stateProvince,
          country,
          household_type: householdType,
          age_range: ageRange,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Update preferences
      const { error: prefsError } = await supabase
        .from('preferences')
        .upsert({
          user_id: user.id,
          dietary_preferences: dietaryPreferences,
          interests,
          theme: selectedTheme,
          ai_name: aiName,
          ai_personality: aiPersonality,
          ai_humor_level: aiHumorLevel,
          ai_formality_level: aiFormalityLevel,
          updated_at: new Date().toISOString(),
        });

      if (prefsError) throw prefsError;

      toast.success('Setup complete! Welcome to PulseOS.');
      navigate('/app');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to PulseOS</h2>
              <p className="text-muted-foreground">
                Let's personalize your experience in just a few steps.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  What should we call you?
                </Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-lg"
                />
              </div>
            </div>
          </div>
        );

      case 'lifestyle':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Your Lifestyle</h2>
              <p className="text-muted-foreground">
                Help us tailor recommendations to your location and household. All fields are optional.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    City
                  </Label>
                  <LocationAutocomplete
                    id="city"
                    placeholder="e.g. Hope Mills, London"
                    value={city}
                    onValueChange={setCity}
                    locationType="city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 opacity-0" />
                    State / Province
                  </Label>
                  <LocationAutocomplete
                    id="state"
                    placeholder="e.g. North Carolina"
                    value={stateProvince}
                    onValueChange={setStateProvince}
                    locationType="region"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 opacity-0" />
                  Country
                </Label>
                <LocationAutocomplete
                  id="country"
                  placeholder="e.g. United States"
                  value={country}
                  onValueChange={setCountry}
                  locationType="country"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Household Type
                </Label>
                <div className="grid grid-cols-2 gap-2">
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
          </div>
        );

      case 'taste':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Your Taste</h2>
              <p className="text-muted-foreground">
                Select your preferences for personalized recommendations.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Dietary Preferences
                </Label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleArrayItem(dietaryPreferences, option, setDietaryPreferences)}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                        dietaryPreferences.includes(option)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary/50 border-border hover:border-primary/50'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Interests
                </Label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleArrayItem(interests, interest, setInterests)}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                        interests.includes(interest)
                          ? 'bg-accent text-accent-foreground border-accent'
                          : 'bg-secondary/50 border-border hover:border-accent/50'
                      )}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'theme':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Your Theme</h2>
              <p className="text-muted-foreground">
                Pick a visual style that suits you. You can change this anytime.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {themes.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => handleThemePreview(t.name)}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all',
                    selectedTheme === t.name
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border bg-secondary/30 hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      'w-4 h-4 rounded-full',
                      t.name === 'night' && 'bg-blue-500',
                      t.name === 'minimal' && 'bg-gray-800',
                      t.name === 'rose' && 'bg-rose-500',
                      t.name === 'gold' && 'bg-amber-500',
                      t.name === 'violet' && 'bg-violet-500',
                      t.name === 'emerald' && 'bg-emerald-500',
                      t.name === 'sunset' && 'bg-orange-500',
                      t.name === 'adaptive' && 'bg-sky-500',
                    )} />
                    <span className="font-medium">{t.label}</span>
                    {selectedTheme === t.name && (
                      <Check className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Meet Your AI</h2>
              <p className="text-muted-foreground">
                Customize how your AI assistant communicates with you.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="aiName" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  AI Name
                </Label>
                <Input
                  id="aiName"
                  placeholder="Give your AI a name"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Personality</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AI_PERSONALITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setAiPersonality(p.value)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all',
                        aiPersonality === p.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary/50 border-border hover:border-primary/50'
                      )}
                    >
                      <div className="font-medium text-sm">{p.label}</div>
                      <div className={cn(
                        'text-xs',
                        aiPersonality === p.value ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      )}>
                        {p.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Humor Level</Label>
                    <span className="text-sm text-muted-foreground">{aiHumorLevel}%</span>
                  </div>
                  <Slider
                    value={[aiHumorLevel]}
                    onValueChange={(v) => setAiHumorLevel(v[0])}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Serious</span>
                    <span>Playful</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Formality Level</Label>
                    <span className="text-sm text-muted-foreground">{aiFormalityLevel}%</span>
                  </div>
                  <Slider
                    value={[aiFormalityLevel]}
                    onValueChange={(v) => setAiFormalityLevel(v[0])}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Casual</span>
                    <span>Formal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Header with progress */}
      <header className="relative z-10 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-bold text-gradient">PulseOS</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="flex gap-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-300',
                  index <= currentStep ? 'bg-primary' : 'bg-secondary'
                )}
              />
            ))}
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'text-xs transition-colors',
                  index === currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-lg p-6 border-border/50 shadow-card">
          {renderStep()}
        </Card>
      </main>

      {/* Footer navigation */}
      <footer className="relative z-10 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              className={cn('flex-1', currentStep === 0 && 'w-full')}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
