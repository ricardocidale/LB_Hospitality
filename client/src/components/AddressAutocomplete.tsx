import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface AutocompleteSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface PlaceDetails {
  lat: number;
  lng: number;
  formattedAddress: string;
  streetAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (details: PlaceDetails) => void;
  placeholder?: string;
  id?: string;
  "data-testid"?: string;
  className?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Start typing an address...",
  id,
  "data-testid": testId,
  className,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string): Promise<void> => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = async (suggestion: AutocompleteSuggestion) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    if (onPlaceSelect) {
      try {
        const res = await fetch(`/api/places/details/${suggestion.placeId}`);
        if (res.ok) {
          const details: PlaceDetails = await res.json();
          onPlaceSelect(details);
        }
      } catch {
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        data-testid={testId}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        className={className}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden" data-testid="autocomplete-suggestions">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b border-border/50 last:border-0"
              onClick={() => handleSelect(s)}
              data-testid={`suggestion-${s.placeId}`}
            >
              <div className="text-sm font-medium text-foreground">{s.mainText}</div>
              <div className="text-xs text-muted-foreground">{s.secondaryText}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
