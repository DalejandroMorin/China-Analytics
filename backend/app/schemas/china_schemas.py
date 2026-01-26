from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any

# 🏗️ ESQUEMA BASE CON DOCUMENTACIÓN MEJORADA
class ChinaHistoricalDataBase(BaseModel):
    """
    Esquema base para datos históricos de China.
    
    Contiene todos los indicadores económicos y sociales desde 1990.
    Todos los campos son opcionales para manejar datos incompletos.
    """
    
    # 🌍 DATOS BÁSICOS
    country: str = Field(
        default="China",
        description="Nombre del país",
        example="China"
    )
    
    year: int = Field(
        ...,
        ge=1990,
        le=2030, 
        description="Año del registro estadístico",
        example=2020
    )
    
    # 💰 INDICADORES ECONÓMICOS - PIB Y CRECIMIENTO
    gdp_usd: Optional[float] = Field(
        None,
        ge=0,
        description="Producto Interno Bruto en dólares americanos (USD)",
        example=14687670000000.0
    )
    
    gdp_ppp: Optional[float] = Field(
        None,
        ge=0, 
        description="PIB en paridad de poder adquisitivo (PPP)",
        example=24255800000000.0
    )
    
    gdp_per_capita_usd: Optional[float] = Field(
        None,
        ge=0,
        description="PIB per cápita en dólares americanos",
        example=10408.67
    )
    
    gdp_growth_pct: Optional[float] = Field(
        None,
        description="Tasa de crecimiento anual del PIB (porcentaje)",
        example=2.24
    )
    
    # 🚢 COMERCIO INTERNACIONAL
    imports_pct_gdp: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Importaciones como porcentaje del PIB",
        example=16.05
    )
    
    exports_pct_gdp: Optional[float] = Field(
        None, 
        ge=0,
        le=100,
        description="Exportaciones como porcentaje del PIB",
        example=18.54
    )
    
    debt_pct_gdp: Optional[float] = Field(
        None,
        ge=0,
        description="Deuda pública como porcentaje del PIB",
        example=66.8
    )
    
    total_reserves_usd: Optional[float] = Field(
        None,
        ge=0,
        description="Reservas internacionales en dólares americanos",
        example=3357241000000.0
    )
    
    # 👥 EMPLEO E INFLACIÓN
    unemployment_pct: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Tasa de desempleo (porcentaje)",
        example=5.0
    )
    
    inflation_pct: Optional[float] = Field(
        None,
        description="Tasa de inflación anual (porcentaje)",
        example=2.42
    )
    
    remittances_pct_gdp: Optional[float] = Field(
        None,
        ge=0,
        description="Remesas como porcentaje del PIB",
        example=0.13
    )
    
    # 📈 DATOS DEMOGRÁFICOS
    population: Optional[float] = Field(
        None,
        ge=0,
        description="Población total del país",
        example=1411000000.0
    )
    
    pop_growth_pct: Optional[float] = Field(
        None,
        description="Tasa de crecimiento poblacional anual (porcentaje)",
        example=0.24
    )
    
    life_expectancy_years: Optional[float] = Field(
        None,
        ge=0,
        le=120,
        description="Esperanza de vida al nacer (años)",
        example=77.097
    )
    
    poverty_pct: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Porcentaje de población en situación de pobreza",
        example=0.1
    )
    
    # 🏷️ METADATOS
    data_quality: Optional[str] = Field(
        "verified",
        description="Calidad del dato: verified, estimated, preliminary",
        example="verified"
    )
    
    data_source: Optional[str] = Field(
        "World Bank", 
        description="Fuente original del dato",
        example="World Bank Open Data"
    )

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "country": "China",
                "year": 2020,
                "gdp_usd": 14687670000000.0,
                "gdp_ppp": 24255800000000.0,
                "gdp_per_capita_usd": 10408.67,
                "gdp_growth_pct": 2.24,
                "imports_pct_gdp": 16.05,
                "exports_pct_gdp": 18.54,
                "debt_pct_gdp": 66.8,
                "total_reserves_usd": 3357241000000.0,
                "unemployment_pct": 5.0,
                "inflation_pct": 2.42,
                "remittances_pct_gdp": 0.13,
                "population": 1411000000.0,
                "pop_growth_pct": 0.24,
                "life_expectancy_years": 77.097,
                "poverty_pct": 0.1,
                "data_quality": "verified",
                "data_source": "World Bank"
            }
        }


# ➕ ESQUEMA PARA CREAR REGISTROS
class ChinaHistoricalDataCreate(ChinaHistoricalDataBase):
    """
    Esquema para crear nuevos registros de datos de China.
    
    **Nota**: No incluye campos automáticos (ID, timestamps).
    Se validan todos los campos según las reglas del esquema base.
    """
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "country": "China",
                "year": 2023,
                "gdp_usd": 16000000000000.0,
                "population": 1420000000.0,
                "life_expectancy_years": 77.5
            }
        }


# 📖 ESQUEMA PARA LEER REGISTROS
class ChinaHistoricalData(ChinaHistoricalDataBase):
    """
    Esquema para leer registros existentes de China.
    
    Incluye todos los campos del esquema base más los campos
    automáticos generados por el sistema.
    """
    
    id: int = Field(
        ...,
        description="ID único del registro en la base de datos",
        example=1
    )
    
    created_at: datetime = Field(
        ...,
        description="Fecha y hora de creación del registro",
        example="2024-01-15T10:30:00Z"
    )
    
    updated_at: datetime = Field(
        ...,
        description="Fecha y hora de última actualización del registro", 
        example="2024-01-15T10:30:00Z"
    )

    class Config:
        from_attributes = True


# 🔄 ESQUEMA PARA ACTUALIZAR REGISTROS
class ChinaHistoricalDataUpdate(BaseModel):
    """
    Esquema para actualizar registros existentes de China.
    
    **Características**:
    - Todos los campos son opcionales
    - Solo se actualizan los campos proporcionados
    - No se permiten actualizaciones de campos automáticos
    """
    
    year: Optional[int] = Field(None, ge=1990, le=2030)
    gdp_usd: Optional[float] = Field(None, ge=0)
    gdp_ppp: Optional[float] = Field(None, ge=0)
    gdp_per_capita_usd: Optional[float] = Field(None, ge=0)
    gdp_growth_pct: Optional[float] = Field(None)
    imports_pct_gdp: Optional[float] = Field(None, ge=0, le=100)
    exports_pct_gdp: Optional[float] = Field(None, ge=0, le=100)
    debt_pct_gdp: Optional[float] = Field(None, ge=0)
    total_reserves_usd: Optional[float] = Field(None, ge=0)
    unemployment_pct: Optional[float] = Field(None, ge=0, le=100)
    inflation_pct: Optional[float] = Field(None)
    remittances_pct_gdp: Optional[float] = Field(None, ge=0)
    population: Optional[float] = Field(None, ge=0)
    pop_growth_pct: Optional[float] = Field(None)
    life_expectancy_years: Optional[float] = Field(None, ge=0, le=120)
    poverty_pct: Optional[float] = Field(None, ge=0, le=100)
    data_quality: Optional[str] = Field(None)
    data_source: Optional[str] = Field(None)

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "gdp_usd": 16500000000000.0,
                "population": 1425000000.0,
                "data_quality": "estimated"
            }
        }