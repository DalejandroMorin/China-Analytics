// HistoricalDataTable.types.ts

export interface HistoricalData {
  id: number;
  country: string;
  year: number;
  gdp_usd: number | null;
  gdp_ppp: number | null;
  gdp_per_capita_usd: number | null;
  gdp_growth_pct: number | null;
  imports_pct_gdp: number | null;
  exports_pct_gdp: number | null;
  debt_pct_gdp: number | null;
  total_reserves_usd: number | null;
  unemployment_pct: number | null;
  inflation_pct: number | null;
  remittances_pct_gdp: number | null;
  population: number | null;
  pop_growth_pct: number | null;
  life_expectancy_years: number | null;
  poverty_pct: number | null;
  data_quality: string;
  data_source: string;
  created_at: string;
  updated_at: string;
}

export interface ColumnConfig {
  key: keyof HistoricalData | string;
  label: string;
  format: 'currency' | 'percent' | 'population' | 'decimal' | 'year' | 'text';
  category: 'económicas' | 'sociales' | 'metadata';
  visibleByDefault?: boolean;
}

export interface HistoricalDataTableProps {
  initialPageSize?: number;
  showExportButton?: boolean;
  onRowClick?: (row: HistoricalData) => void;
}

export type SortDirection = 'asc' | 'desc' | null;
export type SortConfig = {
  key: keyof HistoricalData;
  direction: SortDirection;
};

// Añadir estos tipos nuevos para las gráficas
export interface Indicator {
  field: string;
  name: string;
  description: string;
  unit: string;
}

export type ViewMode = 'table' | 'chart';
export type ChartType = 'yearly' | 'comparative';