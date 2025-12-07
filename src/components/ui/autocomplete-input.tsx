import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestions: string[];
  value: string;
  onValueChange: (value: string) => void;
}

export function AutocompleteInput({
  suggestions,
  value,
  onValueChange,
  className,
  ...props
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    if (value.length >= 1) {
      const filtered = suggestions
        .filter((s) => s.toLowerCase().startsWith(value.toLowerCase()))
        .slice(0, 8);
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0 && filtered[0].toLowerCase() !== value.toLowerCase());
    } else {
      setFilteredSuggestions([]);
      setIsOpen(false);
    }
  }, [value, suggestions]);

  const handleSelect = (suggestion: string) => {
    onValueChange(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay closing to allow click on suggestion
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 150);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => {
          if (filteredSuggestions.length > 0) setIsOpen(true);
        }}
        onBlur={handleBlur}
        className={className}
        {...props}
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
