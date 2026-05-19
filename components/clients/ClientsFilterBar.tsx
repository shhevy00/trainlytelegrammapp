"use client";

import type { ReactElement } from "react";
import type { ClientListFilter } from "@/lib/clients/clientAttention";

export interface ClientsFilterCounts {
  all: number;
  today: number;
}

interface ClientsFilterBarProps {
  filter: ClientListFilter;
  counts: ClientsFilterCounts;
  onFilterChange: (next: ClientListFilter) => void;
}

export function ClientsFilterBar({ filter, counts, onFilterChange }: ClientsFilterBarProps): ReactElement {
  const segmentFilter: "all" | "today" = filter === "today" ? "today" : "all";

  return (
    <div className="clients-filter-bar" role="tablist" aria-label="Список клиентов">
      <button
        type="button"
        role="tab"
        aria-selected={segmentFilter === "all"}
        className={["clients-segment", segmentFilter === "all" ? "clients-segment--active" : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onFilterChange("all")}
      >
        <span className="clients-segment__label">Все</span>
        <span className="clients-segment__count">{counts.all}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={segmentFilter === "today"}
        className={["clients-segment", segmentFilter === "today" ? "clients-segment--active" : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onFilterChange("today")}
      >
        <span className="clients-segment__label">Сегодня</span>
        <span className="clients-segment__count">{counts.today}</span>
      </button>
    </div>
  );
}
