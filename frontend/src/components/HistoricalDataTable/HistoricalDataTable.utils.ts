import type { ColumnConfig } from './HistoricalDataTable.types';

export const columnCategories: ColumnConfig[] = [
  // Metadata
  { key: 'year', label: 'Año', format: 'year', category: 'metadata', visibleByDefault: true },
  { key: 'data_quality', label: 'Calidad', format: 'text', category: 'metadata', visibleByDefault: false },
  { key: 'data_source', label: 'Fuente', format: 'text', category: 'metadata', visibleByDefault: false },
  
  // Económicas
  { key: 'gdp_usd', label: 'PIB (USD)', format: 'currency', category: 'económicas', visibleByDefault: true },
  { key: 'gdp_growth_pct', label: 'Crecimiento PIB %', format: 'percent', category: 'económicas', visibleByDefault: true },
  { key: 'gdp_per_capita_usd', label: 'PIB per cápita', format: 'currency', category: 'económicas', visibleByDefault: false },
  { key: 'imports_pct_gdp', label: 'Importaciones % PIB', format: 'percent', category: 'económicas', visibleByDefault: false },
  { key: 'exports_pct_gdp', label: 'Exportaciones % PIB', format: 'percent', category: 'económicas', visibleByDefault: false },
  { key: 'debt_pct_gdp', label: 'Deuda % PIB', format: 'percent', category: 'económicas', visibleByDefault: false },
  { key: 'total_reserves_usd', label: 'Reservas (USD)', format: 'currency', category: 'económicas', visibleByDefault: false },
  { key: 'inflation_pct', label: 'Inflación %', format: 'percent', category: 'económicas', visibleByDefault: true },
  { key: 'remittances_pct_gdp', label: 'Remesas % PIB', format: 'percent', category: 'económicas', visibleByDefault: false },
  
  // Sociales
  { key: 'population', label: 'Población', format: 'population', category: 'sociales', visibleByDefault: true },
  { key: 'pop_growth_pct', label: 'Crecimiento Población %', format: 'percent', category: 'sociales', visibleByDefault: false },
  { key: 'life_expectancy_years', label: 'Esperanza de Vida', format: 'decimal', category: 'sociales', visibleByDefault: true },
  { key: 'poverty_pct', label: 'Pobreza %', format: 'percent', category: 'sociales', visibleByDefault: false },
  { key: 'unemployment_pct', label: 'Desempleo %', format: 'percent', category: 'sociales', visibleByDefault: false },
];

// Tipo para los valores de formato
type FormatType = 'currency' | 'percent' | 'population' | 'decimal' | 'year' | 'text';

export const formatValue = (
  value: number | string | null, 
  formatType: FormatType
): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  
  if (typeof value === 'string') return value;
  
  const numValue = value;
  
  switch (formatType) {
    case 'currency':
      if (numValue === 0) return '$0';
      return `$${(numValue / 1e12).toFixed(2)}T`;
    case 'percent':
      return `${numValue.toFixed(2)}%`;
    case 'population':
      if (numValue === 0) return '0';
      return `${(numValue / 1e6).toFixed(1)}M`;
    case 'decimal':
      return numValue.toFixed(2);
    case 'year':
      return numValue.toString();
    case 'text':
      return numValue.toString();
    default:
      return numValue.toString();
  }
};

export const getVisibleColumns = (): string[] => {
  return columnCategories
    .filter(col => col.visibleByDefault)
    .map(col => col.key);
};

// Función para determinar si una columna es ordenable
export const isSortableColumn = (columnKey: string): boolean => {
  const nonSortableColumns = ['data_quality', 'data_source', 'country'];
  return !nonSortableColumns.includes(columnKey);
};