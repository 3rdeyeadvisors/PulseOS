import * as React from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Prediction {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export interface AddressComponents {
  city?: string;
  state?: string;
  stateLong?: string;
  country?: string;
  zipCode?: string;
}

interface LocationAutocompleteProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
  onAddressComponentsChange?: (components: AddressComponents) => void;
  locationType?: "city" | "region" | "country";
}

const typeMapping: Record<string, string> = {
  city: "(cities)",
  region: "(regions)",
  country: "country",
};

export const LocationAutocomplete = React.forwardRef<HTMLInputElement, LocationAutocompleteProps>(
  ({ value, onValueChange, onAddressComponentsChange, locationType = "city", className, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [predictions, setPredictions] = React.useState<Prediction[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const debounceRef = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
      setInputValue(value);
    }, [value]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchPredictions = async (input: string) => {
      if (input.length < 2) {
        setPredictions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("places-autocomplete", {
          body: { input, types: typeMapping[locationType] },
        });

        if (error) {
          console.error("Autocomplete error:", error);
          setPredictions([]);
          return;
        }

        setPredictions(data.predictions || []);
      } catch (err) {
        console.error("Failed to fetch predictions:", err);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onValueChange(newValue);
      setIsOpen(true);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        fetchPredictions(newValue);
      }, 300);
    };

    const handleSelect = async (prediction: Prediction) => {
      // Extract just the city/region/country name from the main text
      const selectedValue = prediction.mainText;
      setInputValue(selectedValue);
      onValueChange(selectedValue);
      setIsOpen(false);
      setPredictions([]);

      // Fetch address components if callback is provided
      if (onAddressComponentsChange && prediction.placeId) {
        try {
          const { data, error } = await supabase.functions.invoke("places-autocomplete", {
            body: { placeId: prediction.placeId, getDetails: true },
          });

          if (!error && data?.addressComponents) {
            onAddressComponentsChange(data.addressComponents);
          }
        } catch (err) {
          console.error("Failed to fetch address components:", err);
        }
      }
    };

    const handleFocus = () => {
      if (inputValue.length >= 2) {
        setIsOpen(true);
        fetchPredictions(inputValue);
      }
    };

    return (
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Input
            ref={ref}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            className={cn("min-h-[44px]", className)}
            {...props}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        
        {isOpen && predictions.length > 0 && (
          <ul className="absolute z-[100] w-full mt-1 max-h-60 overflow-auto overscroll-contain rounded-md border bg-popover text-popover-foreground shadow-xl">
            {predictions.map((prediction) => (
              <li
                key={prediction.placeId}
                onClick={() => handleSelect(prediction)}
                className="cursor-pointer px-3 py-3 hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px] flex flex-col justify-center"
              >
                <div className="font-medium leading-tight">{prediction.mainText}</div>
                {prediction.secondaryText && (
                  <div className="text-xs text-muted-foreground mt-0.5">{prediction.secondaryText}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

LocationAutocomplete.displayName = "LocationAutocomplete";
