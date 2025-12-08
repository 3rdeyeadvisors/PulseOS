import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const quickQuestions = [
  "Find me something cheap to do today",
  "Where's the cheapest gas right now?",
  "Lunch under $15 that matches my diet?",
  "Summarize today's news without bias",
];

interface FloatingAIButtonProps {
  aiName?: string;
}

export function FloatingAIButton({ aiName = 'Pulse' }: FloatingAIButtonProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleQuickQuestion = (question: string) => {
    // Navigate to chat with the question
    navigate('/app/chat', { state: { initialMessage: question } });
    setIsOpen(false);
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      navigate('/app/chat', { state: { initialMessage: inputValue } });
      setIsOpen(false);
      setInputValue('');
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Drawer */}
      <div
        className={cn(
          'fixed bottom-28 right-4 w-[calc(100%-2rem)] max-w-sm bg-card border border-border/50 rounded-2xl shadow-2xl z-50 transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Ask {aiName}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Questions */}
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder={`Ask ${aiName} anything...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSubmit} disabled={!inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Full Chat Link */}
          <button
            onClick={() => {
              navigate('/app/chat');
              setIsOpen(false);
            }}
            className="w-full mt-3 text-xs text-center text-primary hover:underline"
          >
            Open full chat →
          </button>
        </div>
      </div>

      {/* Floating Button - positioned above footer */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-14 right-4 z-50 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105',
          isOpen && 'rotate-90'
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  );
}
