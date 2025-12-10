import { useState, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  aiName: string;
}

export function ChatInput({ onSend, isLoading, aiName }: ChatInputProps) {
  const [input, setInput] = useState('');

  const { isListening, isSupported, transcript, toggleListening } = useSpeechRecognition({
    onResult: (result) => {
      setInput((prev) => (prev ? `${prev} ${result}` : result));
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Update input with interim transcript while listening
  useEffect(() => {
    if (isListening && transcript) {
      setInput((prev) => {
        // Only update if the transcript is different from current input
        const baseInput = prev.replace(/\s*$/, '');
        if (!baseInput.endsWith(transcript)) {
          return baseInput ? `${baseInput} ${transcript}` : transcript;
        }
        return prev;
      });
    }
  }, [transcript, isListening]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    toggleListening();
  };

  return (
    <div className="flex gap-2 pt-4 border-t border-border/50">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? 'Listening...' : `Message ${aiName}...`}
        className={cn(
          "min-h-[52px] max-h-32 resize-none bg-secondary/50",
          isListening && "ring-2 ring-primary/50"
        )}
        disabled={isLoading}
      />
      {isSupported && (
        <Button
          onClick={handleMicClick}
          disabled={isLoading}
          size="icon"
          variant={isListening ? "default" : "outline"}
          className={cn(
            "h-[52px] w-[52px] flex-shrink-0 transition-all",
            isListening && "bg-primary animate-pulse"
          )}
          title={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
      )}
      <Button
        onClick={handleSend}
        disabled={!input.trim() || isLoading}
        size="icon"
        className="h-[52px] w-[52px] flex-shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
