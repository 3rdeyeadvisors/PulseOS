import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const quickQuestions = [
  "What's cheap to do near me today?",
  "Quick lunch idea for my diet?",
];

interface FloatingAIButtonProps {
  aiName?: string;
}

export function FloatingAIButton({ aiName = 'Pulse' }: FloatingAIButtonProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset focus state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsInputFocused(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      // Don't hide when input is focused (keyboard is likely open)
      if (isInputFocused) return;
      
      const currentScrollY = window.scrollY;
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        setIsOpen(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isInputFocused]);

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
          'fixed right-4 w-72 bg-card border border-border/50 rounded-2xl shadow-2xl z-50 transition-all duration-300',
          isInputFocused ? 'bottom-4' : 'bottom-28',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-sm">Ask {aiName}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder={`Ask ${aiName} anything...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              className="flex-1 h-9 text-sm"
            />
            <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={handleSubmit} disabled={!inputValue.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuestion(q)}
                className="text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/70 transition-colors text-left leading-snug"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Button - positioned above footer */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-14 right-4 z-50 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105',
          isOpen && 'rotate-90',
          !isVisible && !isOpen && 'translate-y-24 opacity-0 pointer-events-none'
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
