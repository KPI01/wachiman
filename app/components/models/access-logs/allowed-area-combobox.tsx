import { useEffect, useRef, useState } from "react";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

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
        setShowSuggestions(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
          setShowSuggestions(true);
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
    <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
      <PopoverTrigger asChild>
        <div className="w-full">
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
              if (options !== undefined) {
                setSuggestions(getFilteredOptions(query));
              }
            }}
            onInvalid={(event) => {
              // Keep the required-field browser tooltip from covering the options.
              event.preventDefault();
              if (options !== undefined) {
                setSuggestions(getFilteredOptions(query));
              }
              setShowSuggestions(true);
            }}
            onBlur={() => {
              if (requireSelection && !selectedValueRef.current) {
                inputRef.current?.setCustomValidity(
                  query.trim()
                    ? "Selecciona un área autorizada de la lista."
                    : "",
                );
              }
            }}
            onChange={(event) => {
              handleQueryChange(event.currentTarget.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {name ? (
            <input type="hidden" name={name} value={value} form={form} />
          ) : null}
        </div>
      </PopoverTrigger>
      {showSuggestions ? (
        <PopoverContent
          id={`${id}-suggestions`}
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-[60] max-h-48 w-[var(--radix-popover-trigger-width)] gap-0 overflow-y-auto p-1"
          onOpenAutoFocus={(event) => event.preventDefault()}
          aria-label="Áreas autorizadas"
        >
          <ul role="listbox" className="w-full">
            {suggestions.length === 0 ? (
              <li className="px-2 py-1.5 text-sm text-muted-foreground">
                {options?.length === 0
                  ? "No hay áreas autorizadas configuradas."
                  : "No se encontraron áreas."}
              </li>
            ) : (
              suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  role="option"
                  aria-selected={index === selectedSuggestionIndex}
                  className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm ${
                    index === selectedSuggestionIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  {suggestion.name}
                </li>
              ))
            )}
          </ul>
        </PopoverContent>
      ) : null}
    </Popover>
  );
}
