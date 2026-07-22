import { useEffect, useRef, useState } from "react";
import { Input } from "~/components/ui/input";

type CompanyOption = {
  id: string;
  name: string;
};

type CompanyComboboxProps = {
  id: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
};

export default function CompanyCombobox({
  id,
  name,
  value,
  onValueChange,
  required,
}: CompanyComboboxProps) {
  const [suggestions, setSuggestions] = useState<CompanyOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedValueRef = useRef<string | null>(null);

  useEffect(() => {
    const query = value.trim();
    const controller = new AbortController();

    if (selectedValueRef.current === query) {
      selectedValueRef.current = null;
      setSuggestions([]);
      setShowSuggestions(false);
      return () => controller.abort();
    }

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return () => controller.abort();
    }

    const timeoutId = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query });
        const response = await fetch(`/api/companies/search?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = (await response.json()) as CompanyOption[];
        setSuggestions(data);
        setSelectedSuggestionIndex(0);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(company: CompanyOption) {
    selectedValueRef.current = company.name;
    onValueChange(company.name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) {
      if (event.key === "Escape") setShowSuggestions(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSuggestionIndex((currentIndex) =>
        Math.min(currentIndex + 1, suggestions.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSuggestionIndex((currentIndex) =>
        Math.max(currentIndex - 1, 0),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectSuggestion(suggestions[selectedSuggestionIndex]);
    } else if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        name={name}
        value={value}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls={`${id}-suggestions`}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul
          id={`${id}-suggestions`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {suggestions.map((company, index) => (
            <li
              key={company.id}
              role="option"
              aria-selected={index === selectedSuggestionIndex}
              className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm ${
                index === selectedSuggestionIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(company);
              }}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
            >
              {company.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
