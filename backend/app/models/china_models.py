# Importamos los tipos de datos de SQLAlchemy
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

# Importamos la Base desde nuestra configuración de base de datos
from app.database.database import Base

class ChinaHistoricalData(Base):
    """
    Modelo para almacenar los datos históricos de China
    Cada instancia de esta clase = un registro anual de China
    """
    
    # 📊 NOMBRE DE LA TABLA EN LA BASE DE DATOS
    __tablename__ = "china_historical_data"
    
    # 🔑 LLAVE PRIMARIA - Identificador único de cada registro
    id = Column(Integer, primary_key=True, index=True)
    # index=True → Crea índice para búsquedas rápidas por ID
    
    # 🌍 DATOS BÁSICOS DE IDENTIFICACIÓN
    country = Column(String(50), nullable=False, default="China")
    # nullable=False → Este campo es obligatorio
    # default="China" → Valor por defecto, siempre será China
    
    year = Column(Integer, nullable=False, index=True)
    # index=True → Índice para búsquedas y filtros por año
    
    # 💰 INDICADORES ECONÓMICOS - PIB Y CRECIMIENTO
    gdp_usd = Column(Float, nullable=True)  # PIB en dólares americanos
    gdp_ppp = Column(Float, nullable=True)  # PIB en paridad de poder adquisitivo
    gdp_per_capita_usd = Column(Float, nullable=True)  # PIB per cápita en USD
    gdp_growth_pct = Column(Float, nullable=True)  # Crecimiento del PIB en %
    
    # 🚢 COMERCIO INTERNACIONAL
    imports_pct_gdp = Column(Float, nullable=True)  # Importaciones como % del PIB
    exports_pct_gdp = Column(Float, nullable=True)  # Exportaciones como % del PIB
    debt_pct_gdp = Column(Float, nullable=True)     # Deuda como % del PIB
    total_reserves_usd = Column(Float, nullable=True)  # Reservas internacionales en USD
    
    # 👥 EMPLEO E INFLACIÓN
    unemployment_pct = Column(Float, nullable=True)  # Tasa de desempleo en %
    inflation_pct = Column(Float, nullable=True)     # Inflación anual en %
    remittances_pct_gdp = Column(Float, nullable=True)  # Remesas como % del PIB
    
    # 📈 DATOS DEMOGRÁFICOS
    population = Column(Float, nullable=True)        # Población total
    pop_growth_pct = Column(Float, nullable=True)    # Crecimiento poblacional en %
    life_expectancy_years = Column(Float, nullable=True)  # Esperanza de vida en años
    poverty_pct = Column(Float, nullable=True)       # % de población en pobreza
    
    # 🏷️ METADATOS DEL REGISTRO
    created_at = Column(DateTime, default=datetime.utcnow)
    # Fecha de creación automática
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Fecha de última actualización (se actualiza automáticamente)
    
    # ✅ CONTROL DE CALIDAD
    data_quality = Column(String(20), default="verified")
    # Podría ser: "verified", "estimated", "preliminary"
    
    # 💾 FUENTE DE DATOS
    data_source = Column(String(100), default="World Bank")
    # Para saber de dónde vienen los datos

    def __repr__(self):
        """
        Representación en texto del objeto - útil para debugging
        """
        return f"<ChinaData(year={self.year}, gdp_usd={self.gdp_usd})>"