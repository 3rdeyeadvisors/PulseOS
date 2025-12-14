import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo account credentials for Apple Review
const DEMO_EMAIL = 'demo@pulseos.app';
const DEMO_PASSWORD = 'PulseDemo2025!';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Check if demo user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingDemo = existingUsers?.users?.find(u => u.email === DEMO_EMAIL);
    
    let userId: string;
    
    if (existingDemo) {
      console.log('Demo account already exists, updating data...');
      userId = existingDemo.id;
    } else {
      // Create demo user
      console.log('Creating demo account...');
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Demo User',
        },
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }
      
      userId = newUser.user.id;
      console.log('Demo user created:', userId);
    }

    // Update profile with demo data
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        user_id: userId,
        email: DEMO_EMAIL,
        full_name: 'Demo User',
        username: 'demo_user',
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        zip_code: '94102',
        age_range: '25-34',
        household_type: 'single',
        onboarding_completed: true,
        profile_public: true,
        interests_public: false,
        timezone: 'America/Los_Angeles',
        current_streak: 5,
        longest_streak: 12,
        last_active_date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.error('Profile update error:', profileError);
    } else {
      console.log('Profile updated');
    }

    // Update preferences with demo data
    const { error: prefsError } = await adminClient
      .from('preferences')
      .upsert({
        user_id: userId,
        theme: 'night',
        temperature_unit: 'fahrenheit',
        ai_name: 'Pulse',
        ai_personality: 'balanced',
        ai_humor_level: 60,
        ai_formality_level: 40,
        interests: ['technology', 'fitness', 'cooking', 'travel'],
        dietary_preferences: ['vegetarian'],
        enabled_modules: ['greeting', 'weather', 'news', 'food', 'daily-picks', 'tasks', 'streak'],
      }, { onConflict: 'user_id' });

    if (prefsError) {
      console.error('Preferences update error:', prefsError);
    } else {
      console.log('Preferences updated');
    }

    // Add sample tasks
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Delete existing demo tasks first
    await adminClient.from('tasks').delete().eq('user_id', userId);

    const sampleTasks = [
      { user_id: userId, title: 'Review morning dashboard', completed: true, due_date: today.toISOString().split('T')[0] },
      { user_id: userId, title: 'Try a recommended restaurant', completed: false, due_date: today.toISOString().split('T')[0] },
      { user_id: userId, title: 'Check local events this weekend', completed: false, due_date: tomorrow.toISOString().split('T')[0] },
      { user_id: userId, title: 'Update dietary preferences', completed: true, due_date: today.toISOString().split('T')[0] },
      { user_id: userId, title: 'Explore AI chat features', completed: false, due_date: nextWeek.toISOString().split('T')[0] },
    ];

    const { error: tasksError } = await adminClient
      .from('tasks')
      .insert(sampleTasks);

    if (tasksError) {
      console.error('Tasks insert error:', tasksError);
    } else {
      console.log('Sample tasks created');
    }

    // Add a welcome notification
    await adminClient.from('notifications').delete().eq('user_id', userId);
    
    const { error: notifError } = await adminClient
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'welcome',
        title: 'Welcome to PulseOS! 🎉',
        message: 'Your personal life dashboard is ready. Explore your settings to customize your experience.',
        read: false,
      });

    if (notifError) {
      console.error('Notification insert error:', notifError);
    } else {
      console.log('Welcome notification created');
    }

    // Add sample chat messages to show AI capability
    await adminClient.from('chat_messages').delete().eq('user_id', userId);

    const sampleMessages = [
      { user_id: userId, role: 'user', content: 'What\'s the weather like today?' },
      { user_id: userId, role: 'assistant', content: 'Based on your location in San Francisco, today looks partly cloudy with temperatures around 65°F (18°C). Perfect weather for a walk in Golden Gate Park!' },
      { user_id: userId, role: 'user', content: 'Can you recommend a good vegetarian restaurant nearby?' },
      { user_id: userId, role: 'assistant', content: 'I\'d recommend checking out Greens Restaurant in Fort Mason - it\'s been a beloved vegetarian spot since 1979 with stunning bay views. For something more casual, Wildseed in the Castro has fantastic plant-based comfort food!' },
    ];

    const { error: chatError } = await adminClient
      .from('chat_messages')
      .insert(sampleMessages);

    if (chatError) {
      console.error('Chat messages insert error:', chatError);
    } else {
      console.log('Sample chat messages created');
    }

    // Create daily action score
    const { error: scoreError } = await adminClient
      .from('daily_action_scores')
      .upsert({
        user_id: userId,
        score_date: today.toISOString().split('T')[0],
        tasks_completed: 2,
        tasks_total: 5,
        chat_interactions: 2,
        recommendations_tried: 1,
        social_engagement: 0,
        streak_bonus: 5,
        daily_score: 45,
      }, { onConflict: 'user_id,score_date' });

    if (scoreError) {
      console.error('Daily score error:', scoreError);
    } else {
      console.log('Daily score created');
    }

    console.log('Demo account setup complete!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo account ready for Apple Review',
        credentials: {
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        },
        note: 'DO NOT share these credentials publicly. For App Store Review only.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
