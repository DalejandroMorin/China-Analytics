# Importaciones necesarias de FastAPI y dependencias
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

# Importaciones corregidas con alias
from app.models.china_models import ChinaHistoricalData as ChinaModel
from app.schemas.china_schemas import ChinaHistoricalData as ChinaSchema, ChinaHistoricalDataCreate
from app.database.database import get_db

# Creamos el router para los endpoints de China
router = APIRouter()

# ENDPOINT 1: Obtener todos los datos históricos con paginación
@router.get("/datos/historicos", response_model=List[ChinaSchema])
def obtener_datos_historicos(
    skip: int = Query(0, description="Número de registros a omitir"),
    limit: int = Query(100, description="Número máximo de registros a devolver", le=1000),
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los datos históricos de China con paginación.
    
    - **skip**: Registros a saltar (para paginación)
    - **limit**: Límite de registros por página (máximo 1000)
    """
    # Consulta a la base de datos con paginación
    datos = db.query(ChinaModel).offset(skip).limit(limit).all()
    return datos




# ENDPOINT 2: Obtener lista de indicadores disponibles
@router.get("/indicadores/lista")
def obtener_lista_indicadores():
    """
    Devuelve la lista de todos los indicadores disponibles en el sistema.
    
    Incluye nombre técnico, nombre legible, descripción y unidad de medida.
    """
    # Lista completa de indicadores basada en el dataset
    indicadores = [
        {
            "field": "gdp_usd",
            "name": "PIB (USD)",
            "description": "Producto Interno Bruto en dólares americanos",
            "unit": "USD"
        },
        {
            "field": "gdp_ppp",
            "name": "PIB (PPP)",
            "description": "Producto Interno Bruto en paridad de poder adquisitivo",
            "unit": "USD"
        },
        {
            "field": "gdp_per_capita_usd",
            "name": "PIB per cápita",
            "description": "Producto Interno Bruto dividido por la población",
            "unit": "USD"
        },
        {
            "field": "gdp_growth_pct",
            "name": "Crecimiento del PIB",
            "description": "Tasa de crecimiento anual del PIB",
            "unit": "%"
        },
        {
            "field": "imports_pct_gdp",
            "name": "Importaciones (% del PIB)",
            "description": "Importaciones como porcentaje del Producto Interno Bruto",
            "unit": "%"
        },
        {
            "field": "exports_pct_gdp",
            "name": "Exportaciones (% del PIB)",
            "description": "Exportaciones como porcentaje del Producto Interno Bruto",
            "unit": "%"
        },
        {
            "field": "total_reserves_usd",
            "name": "Reservas Totales",
            "description": "Reservas internacionales totales en dólares americanos",
            "unit": "USD"
        },
        {
            "field": "unemployment_pct",
            "name": "Tasa de Desempleo",
            "description": "Porcentaje de la población desempleada",
            "unit": "%"
        },
        {
            "field": "inflation_pct",
            "name": "Tasa de Inflación",
            "description": "Inflación anual de precios al consumidor",
            "unit": "%"
        },
        {
            "field": "remittances_pct_gdp",
            "name": "Remesas (% del PIB)",
            "description": "Remesas recibidas como porcentaje del PIB",
            "unit": "%"
        },
        {
            "field": "population",
            "name": "Población Total",
            "description": "Población total del país",
            "unit": "personas"
        },
        {
            "field": "pop_growth_pct",
            "name": "Crecimiento Poblacional",
            "description": "Tasa de crecimiento anual de la población",
            "unit": "%"
        },
        {
            "field": "life_expectancy_years",
            "name": "Esperanza de Vida",
            "description": "Años de esperanza de vida al nacer",
            "unit": "años"
        },
        {
            "field": "poverty_pct",
            "name": "Tasa de Pobreza",
            "description": "Porcentaje de la población viviendo bajo la línea de pobreza",
            "unit": "%"
        },
        {
            "field": "year",
            "name": "Año",
            "description": "Año del registro de datos",
            "unit": "año"
        },
        {
            "field": "country",
            "name": "País",
            "description": "Nombre del país",
            "unit": "texto"
        }
    ]
    return indicadores

# ENDPOINT 3: Obtener datos de un año específico
@router.get("/datos/{year}", response_model=ChinaSchema)
def obtener_datos_por_año(year: int, db: Session = Depends(get_db)):
    """
    Obtiene los datos de China para un año específico.
    
    - **year**: Año a consultar (ej: 2020)
    """
    # Buscar el registro por año
    datos = db.query(ChinaModel).filter(ChinaModel.year == year).first()
    
    # Si no se encuentra, devolver error 404
    if datos is None:
        raise HTTPException(
            status_code=404, 
            detail=f"No se encontraron datos para el año {year}"
        )
    
    return datos


# ENDPOINT 4: Crear nuevo registro de datos
@router.post("/datos/", response_model=ChinaSchema)
def crear_dato(dato: ChinaHistoricalDataCreate, db: Session = Depends(get_db)):
    """
    Crea un nuevo registro de datos para China.
    
    - **dato**: Objeto con todos los datos del nuevo registro
    """
    # Verificar si ya existe un registro para ese año
    existe = db.query(ChinaModel).filter(ChinaModel.year == dato.year).first()
    if existe:
        raise HTTPException(
            status_code=409,
            detail=f"Ya existe un registro para el año {dato.year}"
        )
    
    # Crear nuevo registro
    nuevo_dato = ChinaModel(**dato.dict())
    
    # Guardar en base de datos
    db.add(nuevo_dato)
    db.commit()
    db.refresh(nuevo_dato)
    
    return nuevo_dato
