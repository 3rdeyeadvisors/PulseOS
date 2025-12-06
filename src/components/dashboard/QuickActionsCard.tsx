import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, Settings, Palette, User } from 'lucide-react';

const actions = [
  { icon: MessageCircle, label: 'Chat with AI', href: '/app/chat', color: 'text-primary' },
  { icon: User, label: 'Edit Profile', href: '/app/settings', color: 'text-accent' },
  { icon: Palette, label: 'Change Theme', href: '/app/settings', color: 'text-emerald-400' },
  { icon: Settings, label: 'Settings', href: '/app/settings', color: 'text-orange-400' },
];

export function QuickActionsCard() {
  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-card">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Link key={action.label} to={action.href}>
            <Button
              variant="ghost"
              className="w-full h-auto py-3 flex flex-col items-center gap-2 hover:bg-secondary/50"
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs">{action.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
