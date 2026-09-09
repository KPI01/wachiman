import { useEffect, useRef, useState } from "react";
import { Input } from "~/components/ui/input";

type AllowedAreaOption = {
  id: string;
  name: string;
};

type AllowedAreaComboboxProps = {
  id?: string;
  name?: string;
  options?: AllowedAreaOption[];
  value: string;
  onValueChange: (value: string) => void;
  onNameChange?: (value: string) => void;
  selectedName?: string;
  form?: string;
  required?: boolean;
  requireSelection?: boolean;
  placeholder?: string;
};

export default function AllowedAreaCombobox({
  id = "allowedAreaId",
  name,
  options,
  value,
  onValueChange,
  onNameChange,
  selectedName,
  form,
  required,
  requireSelection = false,
  placeholder,
}: AllowedAreaComboboxProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AllowedAreaOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedValueRef = useRef<string | null>(null);

  function getFilteredOptions(nextQuery: string) {
    const normalizedQuery = nextQuery.trim().toLocaleLowerCase();
    return (options ?? []).filter((area) =>
      area.name.toLocaleLowerCase().includes(normalizedQuery),
    );
  }

  useEffect(() => {
    const searchQuery = query.trim();
    const controller = new AbortController();

    if (options) {
      setSuggestions(getFilteredOptions(searchQuery));
      setSelectedSuggestionIndex(0);
      return () => controller.abort();
    }

    if (selectedValueRef.current === searchQuery) {
      selectedValueRef.current = null;
      setSuggestions([]);
      setShowSuggestions(false);
      return () => controller.abort();
    }

    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return () => controller.abort();
    }

    const timeoutId = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: searchQuery });
        const response = await fetch(`/api/access-logs/allowed-areas/search?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = (await response.json()) as AllowedAreaOption[];
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
  }, [query]);

  useEffect(() => {
    if (selectedName) setQuery(selectedName);
    else if (!value) setQuery("");
  }, [selectedName, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(suggestion: AllowedAreaOption) {
    selectedValueRef.current = suggestion.name;
    inputRef.current?.setCustomValidity("");
    setQuery(suggestion.name);
    onValueChange(suggestion.id);
    onNameChange?.(suggestion.name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function handleQueryChange(nextQuery: string) {
    selectedValueRef.current = null;
    setQuery(nextQuery);
    onValueChange("");
    onNameChange?.(nextQuery);
    if (requireSelection) {
      inputRef.current?.setCustomValidity(
        nextQuery.trim() ? "Selecciona un área autorizada de la lista." : "",
      );
    }
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
      setSelectedSuggestionIndex((currentIndex) => Math.max(currentIndex - 1, 0));
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
        ref={inputRef}
        id={`${id}-search`}
        value={query}
        required={required && !value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls={`${id}-suggestions`}
        onFocus={() => {
          if (options) {
            setSuggestions(getFilteredOptions(query));
            setShowSuggestions(true);
          }
        }}
        onBlur={() => {
          if (requireSelection && !selectedValueRef.current) {
            inputRef.current?.setCustomValidity(
              query.trim() ? "Selecciona un área autorizada de la lista." : "",
            );
          }
          setShowSuggestions(false);
        }}
        onChange={(event) => handleQueryChange(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
      />
      {name ? <input type="hidden" name={name} value={value} form={form} /> : null}
      {showSuggestions && (
        <ul
          id={`${id}-suggestions`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {suggestions.length === 0 ? (
            <li className="px-2 py-1.5 text-sm text-muted-foreground">
              No se encontraron áreas.
            </li>
          ) : suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === selectedSuggestionIndex}
              className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm ${
                index === selectedSuggestionIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(suggestion);
              }}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
