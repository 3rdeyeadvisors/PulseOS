import { User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  aiName: string;
}

export function ChatMessage({ role, content, aiName }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : ''
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary/10 border border-primary/20'
            : 'bg-accent/10 border border-accent/20'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary" />
        ) : (
          <Sparkles className="h-4 w-4 text-accent" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border/50 rounded-tl-sm'
        )}
      >
        {!isUser && (
          <p className="text-xs text-muted-foreground mb-1 font-medium">{aiName}</p>
        )}
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {content || (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse delay-200" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
