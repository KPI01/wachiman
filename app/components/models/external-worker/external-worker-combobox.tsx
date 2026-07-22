import { useEffect, useRef, useState } from "react";
import { Input } from "~/components/ui/input";
import type { ExternalWorkerListItem } from "~/lib/database/external-worker.server";

type ExternalWorkerComboboxProps = {
  searchBy: "legalId" | "name";
  onSelect: (worker: ExternalWorkerListItem) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

async function searchWorkers(query: string): Promise<ExternalWorkerListItem[]> {
  if (query.length < 2) return [];

  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/external-workers/search?${params}`);

  if (!response.ok) return [];

  return response.json();
}

export default function ExternalWorkerCombobox({
  searchBy,
  onSelect,
  id,
  placeholder,
  className,
  inputRef: externalInputRef,
}: ExternalWorkerComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExternalWorkerListItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const internalRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = externalInputRef || internalRef;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const data = await searchWorkers(query);
      setResults(data);
      setSelectedIndex(0);
      setIsOpen(data.length > 0);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef?.current &&
        !inputRef.current.parentElement?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputRef]);

  function handleSelect(worker: ExternalWorkerListItem) {
    onSelect(worker);
    setQuery(
      searchBy === "legalId" ? worker.legalId : `${worker.firstName} ${worker.lastName}`,
    );
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={id ? `${id}-suggestions` : undefined}
      />
      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id={id ? `${id}-suggestions` : undefined}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {results.map((worker, index) => (
            <li
              key={worker.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm ${
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              onMouseDown={(event) => {
                event.preventDefault();
                handleSelect(worker);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="font-medium">
                {worker.firstName} {worker.lastName}
              </span>
              <span className="ml-2 text-muted-foreground">
                {worker.legalId}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                {worker.company?.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
