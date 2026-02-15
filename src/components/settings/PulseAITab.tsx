import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const personalities = [
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable', emoji: '😊' },
  { value: 'professional', label: 'Professional', description: 'Formal and precise', emoji: '👔' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of casual and formal', emoji: '⚖️' },
  { value: 'witty', label: 'Witty', description: 'Clever and playful', emoji: '😏' },
];

export function PulseAITab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiName, setAiName] = useState('Pulse');
  const [aiPersonality, setAiPersonality] = useState('balanced');
  const [humorLevel, setHumorLevel] = useState(50);
  const [formalityLevel, setFormalityLevel] = useState(50);

  useEffect(() => {
    async function fetchPreferences() {
      if (!user) return;

      const { data } = await supabase
        .from('preferences')
        .select('ai_name, ai_personality, ai_humor_level, ai_formality_level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setAiName(data.ai_name || 'Pulse');
        setAiPersonality(data.ai_personality || 'balanced');
        setHumorLevel(data.ai_humor_level ?? 50);
        setFormalityLevel(data.ai_formality_level ?? 50);
      }
      setLoading(false);
    }

    fetchPreferences();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('preferences')
      .upsert({
        user_id: user.id,
        ai_name: aiName,
        ai_personality: aiPersonality,
        ai_humor_level: humorLevel,
        ai_formality_level: formalityLevel,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast.error('Failed to save AI settings');
    } else {
      toast.success('AI settings saved');
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
        <CardTitle>PulseAI Settings</CardTitle>
        <CardDescription>Customize your AI assistant's personality and behavior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="aiName">AI Name</Label>
          <Input
            id="aiName"
            value={aiName}
            onChange={(e) => setAiName(e.target.value)}
            placeholder="Name your AI assistant"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground">Give your AI a custom name</p>
        </div>

        <div className="space-y-4">
          <Label>Personality Type</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {personalities.map((p) => {
              const isSelected = aiPersonality === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setAiPersonality(p.value)}
                  className={cn(
                    'relative p-3 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  )}
                >
                  <span className="text-xl">{p.emoji}</span>
                  <p className="text-sm font-medium mt-1">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
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
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Humor Level</Label>
              <span className="text-sm text-muted-foreground">{humorLevel}%</span>
            </div>
            <Slider
              value={[humorLevel]}
              onValueChange={(value) => setHumorLevel(value[0])}
              max={100}
              step={10}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Serious</span>
              <span>Playful</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Formality Level</Label>
              <span className="text-sm text-muted-foreground">{formalityLevel}%</span>
            </div>
            <Slider
              value={[formalityLevel]}
              onValueChange={(value) => setFormalityLevel(value[0])}
              max={100}
              step={10}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Casual</span>
              <span>Formal</span>
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
