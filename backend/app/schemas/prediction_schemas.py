# app/schemas/prediction_schemas.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum

# =============================================================================
# ENUMS PARA VALIDACIÓN
# =============================================================================

class ModeloML(str, Enum):
    """
    Modelos de Machine Learning disponibles para predicciones.
    
    **Modelos disponibles**:
    - `arima`: Modelo ARIMA para series temporales
    - `random_forest`: Random Forest para relaciones no lineales  
    - `linear_regression`: Regresión lineal (extensión del análisis actual)
    - `prophet`: Facebook Prophet para forecasting robusto
    - `auto`: Selección automática del mejor modelo
    """
    ARIMA = "arima"
    RANDOM_FOREST = "random_forest"
    LINEAR_REGRESSION = "linear_regression"
    PROPHET = "prophet"
    AUTO = "auto"

class HorizontePrediccion(str, Enum):
    """
    Horizontes de predicción disponibles.
    
    **Opciones**:
    - `corto_plazo`: 2021-2025 (5 años)
    - `medio_plazo`: 2026-2030 (10 años total)
    - `completo`: 2021-2030 (10 años)
    """
    CORTO_PLAZO = "corto_plazo"
    MEDIO_PLAZO = "medio_plazo"
    COMPLETO = "completo"

# =============================================================================
# ESQUEMAS BASE PARA PREDICCIONES
# =============================================================================

class PrediccionIndividual(BaseModel):
    """
    Esquema para una predicción individual por año.
    
    Representa el valor predicho para un año específico con intervalos de confianza.
    """
    
    año: int = Field(
        ...,
        ge=2000,  # CAMBIADO: de 2021 a 2000 para permitir años anteriores
        le=2030,
        description="Año de la predicción",
        example=2025
    )
    
    valor_predicho: float = Field(
        ...,
        description="Valor predicho para el indicador",
        example=16000000000000.0
    )
    
    intervalo_confianza_80: List[float] = Field(
        ...,
        description="Intervalo de confianza al 80% [límite_inferior, límite_superior]",
        example=[15500000000000.0, 16500000000000.0]
    )
    
    intervalo_confianza_95: List[float] = Field(
        ...,
        description="Intervalo de confianza al 95% [límite_inferior, límite_superior]", 
        example=[15000000000000.0, 17000000000000.0]
    )
    
    crecimiento_anual_pct: Optional[float] = Field(
        None,
        description="Crecimiento porcentual anual respecto al año anterior",
        example=5.2
    )

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "año": 2025,
                "valor_predicho": 16000000000000.0,
                "intervalo_confianza_80": [15500000000000.0, 16500000000000.0],
                "intervalo_confianza_95": [15000000000000.0, 17000000000000.0],
                "crecimiento_anual_pct": 5.2
            }
        }



class MetricasModelo(BaseModel):
    """
    Esquema para métricas de evaluación del modelo.
    
    Proporciona medidas de precisión y calidad de las predicciones.
    """
    
    r_cuadrado: float = Field(
        ...,
        ge=0,
        le=1,
        description="Coeficiente de determinación R²",
        example=0.95
    )
    
    mse: float = Field(
        ...,
        ge=0,
        description="Error cuadrático medio (Mean Squared Error)",
        example=0.023
    )
    
    mae: float = Field(
        ...,
        ge=0, 
        description="Error absoluto medio (Mean Absolute Error)",
        example=0.015
    )
    
    mape: float = Field(
        ...,
        ge=0,
        description="Error porcentual absoluto medio (Mean Absolute Percentage Error)",
        example=2.5
    )
    
    calidad_prediccion: str = Field(
        ...,
        description="Evaluación cualitativa de la calidad",
        example="excelente"
    )
    
    class Config:
        from_attributes = True

# =============================================================================
# ESQUEMAS PARA SOLICITUDES DE PREDICCIÓN
# =============================================================================

class PredictionRequest(BaseModel):
    """
    Esquema para solicitar predicciones de un indicador.
    
    Permite personalizar el modelo ML y horizonte de predicción.
    """
    
    indicador: str = Field(
        ...,
        description="Nombre del indicador a predecir (ej: 'gdp_usd', 'population')",
        example="gdp_usd"
    )
    
    modelo: ModeloML = Field(
        default=ModeloML.AUTO,
        description="Modelo de ML a utilizar para la predicción",
        example="arima"
    )
    
    horizonte: HorizontePrediccion = Field(
        default=HorizontePrediccion.COMPLETO,
        description="Horizonte temporal de la predicción",
        example="completo"
    )
    
    incluir_metricas: bool = Field(
        default=True,
        description="Incluir métricas de evaluación del modelo",
        example=True
    )
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "indicador": "gdp_usd",
                "modelo": "auto",
                "horizonte": "completo",
                "incluir_metricas": True
            }
        }

class BatchPredictionRequest(BaseModel):
    """
    Esquema para solicitar predicciones por lote de múltiples indicadores.
    
    Útil para obtener predicciones coordinadas de varios indicadores relacionados.
    """
    
    indicadores: List[str] = Field(
        ...,
        description="Lista de indicadores a predecir",
        example=["gdp_usd", "population", "exports_pct_gdp"]
    )
    
    modelo: ModeloML = Field(
        default=ModeloML.AUTO,
        description="Modelo de ML a utilizar para todas las predicciones",
        example="random_forest"
    )
    
    horizonte: HorizontePrediccion = Field(
        default=HorizontePrediccion.CORTO_PLAZO,
        description="Horizonte temporal de las predicciones",
        example="corto_plazo"
    )
    
    class Config:
        from_attributes = True

# =============================================================================
# ESQUEMAS PARA RESPUESTAS DE PREDICCIÓN
# =============================================================================

class PredictionResponse(BaseModel):
    """
    Esquema principal para respuestas de predicción.
    
    Contiene las predicciones, metadatos y métricas de evaluación.
    """
    
    # Información básica
    indicador: str = Field(
        ...,
        description="Indicador predicho",
        example="gdp_usd"
    )
    
    modelo_utilizado: str = Field(
        ...,
        description="Modelo de ML utilizado para la predicción",
        example="ARIMA"
    )
    
    # Predicciones
    predicciones: List[PrediccionIndividual] = Field(
        ...,
        description="Lista de predicciones por año"
    )
    
    # Métricas de evaluación
    metricas: Optional[MetricasModelo] = Field(
        None,
        description="Métricas de evaluación del modelo (si se solicitaron)"
    )
    
    # Metadatos
    metadatos: Dict[str, Any] = Field(
        ...,
        description="Metadatos del proceso de predicción",
        example={
            "rango_entrenamiento": "1991-2020",
            "horizonte_prediccion": "2021-2030",
            "total_años_entrenamiento": 30,
            "ultima_actualizacion": "2024-01-15T10:30:00Z",
            "tiempo_procesamiento_segundos": 2.34
        }
    )
    
    # Resumen ejecutivo
    resumen: Dict[str, Any] = Field(
        ...,
        description="Resumen ejecutivo de las predicciones",
        example={
            "valor_final_2020": 14687673892882.0,
            "valor_final_2030": 21000000000000.0,
            "crecimiento_total_pct": 43.0,
            "cagr_2020_2030": 3.6,
            "tendencia_principal": "crecimiento_moderado"
        }
    )

    class Config:
        from_attributes = True

class BatchPredictionResponse(BaseModel):
    """
    Esquema para respuestas de predicción por lote.
    
    Contiene múltiples predicciones coordinadas.
    """
    
    predicciones: List[PredictionResponse] = Field(
        ...,
        description="Lista de predicciones individuales"
    )
    
    metadatos_globales: Dict[str, Any] = Field(
        ...,
        description="Metadatos globales del proceso por lote",
        example={
            "total_indicadores": 3,
            "modelo_utilizado": "random_forest",
            "horizonte_prediccion": "2021-2025",
            "tiempo_total_procesamiento_segundos": 5.67,
            "fecha_generacion": "2024-01-15T10:30:00Z"
        }
    )
    
    correlaciones: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Correlaciones entre las predicciones de diferentes indicadores"
    )
    
    class Config:
        from_attributes = True

# =============================================================================
# ESQUEMAS PARA ENTRENAMIENTO DE MODELOS
# =============================================================================

class ModelTrainingRequest(BaseModel):
    """
    Esquema para solicitar el entrenamiento de un modelo específico.
    
    Permite entrenar modelos personalizados con parámetros específicos.
    """
    
    indicador: str = Field(
        ...,
        description="Indicador para entrenar el modelo",
        example="gdp_usd"
    )
    
    modelo: ModeloML = Field(
        ...,
        description="Modelo de ML a entrenar",
        example="arima"
    )
    
    parametros_personalizados: Optional[Dict[str, Any]] = Field(
        None,
        description="Parámetros personalizados para el modelo",
        example={"order": (1, 1, 1), "seasonal_order": (1, 1, 1, 12)}
    )
    
    validacion_cruzada: bool = Field(
        default=True,
        description="Realizar validación cruzada durante el entrenamiento",
        example=True
    )
    
    class Config:
        from_attributes = True

class ModelTrainingResponse(BaseModel):
    """
    Esquema para respuestas de entrenamiento de modelos.
    """
    
    indicador: str = Field(
        ...,
        description="Indicador del modelo entrenado",
        example="gdp_usd"
    )
    
    modelo: str = Field(
        ...,
        description="Modelo entrenado",
        example="ARIMA"
    )
    
    estado: str = Field(
        ...,
        description="Estado del entrenamiento",
        example="completado"
    )
    
    metricas_entrenamiento: MetricasModelo = Field(
        ...,
        description="Métricas del modelo entrenado"
    )
    
    parametros_utilizados: Dict[str, Any] = Field(
        ...,
        description="Parámetros utilizados para el entrenamiento"
    )
    
    tiempo_entrenamiento_segundos: float = Field(
        ...,
        description="Tiempo total de entrenamiento en segundos",
        example=12.45
    )
    
    fecha_entrenamiento: datetime = Field(
        ...,
        description="Fecha y hora del entrenamiento"
    )
    
    class Config:
        from_attributes = True

# =============================================================================
# ESQUEMAS PARA INFORMACIÓN DE MODELOS
# =============================================================================

class ModelInfo(BaseModel):
    """
    Esquema para información de modelos disponibles.
    """
    
    nombre: str = Field(
        ...,
        description="Nombre del modelo",
        example="ARIMA"
    )
    
    descripcion: str = Field(
        ...,
        description="Descripción del modelo",
        example="Modelo ARIMA para series temporales con componentes estacionales"
    )
    
    indicadores_compatibles: List[str] = Field(
        ...,
        description="Indicadores compatibles con este modelo",
        example=["gdp_usd", "population", "exports_pct_gdp"]
    )
    
    precision_promedio: float = Field(
        ...,
        description="Precisión promedio del modelo (R²)",
        example=0.92
    )
    
    ultimo_entrenamiento: Optional[datetime] = Field(
        None,
        description="Fecha del último entrenamiento"
    )
    
    estado: str = Field(
        ...,
        description="Estado del modelo",
        example="disponible"
    )
    
    class Config:
        from_attributes = True

class AvailableIndicatorsResponse(BaseModel):
    """
    Esquema para listar indicadores disponibles para predicción.
    """
    
    indicadores: List[Dict[str, Any]] = Field(
        ...,
        description="Lista de indicadores predecibles",
        example=[
            {
                "indicador": "gdp_usd",
                "nombre": "PIB (USD)",
                "predecible": True,
                "modelo_recomendado": "arima",
                "precision_esperada": 0.95
            }
        ]
    )
    
    total_predecibles: int = Field(
        ...,
        description="Número total de indicadores predecibles",
        example=12
    )
    
    class Config:
        from_attributes = True

# =============================================================================
# ESQUEMAS PARA ERRORES Y ESTADO
# =============================================================================

class PredictionError(BaseModel):
    """
    Esquema para respuestas de error en predicciones.
    """
    
    error: str = Field(
        ...,
        description="Tipo de error",
        example="indicador_no_soportado"
    )
    
    mensaje: str = Field(
        ...,
        description="Mensaje descriptivo del error", 
        example="El indicador 'indicador_invalido' no está disponible para predicción"
    )
    
    indicadores_disponibles: Optional[List[str]] = Field(
        None,
        description="Lista de indicadores disponibles (si aplica)"
    )
    
    detalle_tecnico: Optional[str] = Field(
        None,
        description="Detalle técnico del error para debugging"
    )
    
    class Config:
        from_attributes = True

class SystemStatus(BaseModel):
    """
    Esquema para estado del sistema de predicciones.
    """
    
    estado: str = Field(
        ...,
        description="Estado general del sistema",
        example="operacional"
    )
    
    modelos_entrenados: int = Field(
        ...,
        description="Número de modelos entrenados",
        example=8
    )
    
    memoria_utilizada_mb: float = Field(
        ...,
        description="Memoria utilizada por modelos (MB)",
        example=45.2
    )
    
    ultima_actualizacion: datetime = Field(
        ...,
        description="Última actualización del sistema"
    )
    
    metricas_rendimiento: Dict[str, float] = Field(
        ...,
        description="Métricas de rendimiento del sistema",
        example={
            "tiempo_promedio_prediccion": 1.23,
            "precision_promedio": 0.91,
            "solicitudes_procesadas": 150
        }
    )
    
    class Config:
        from_attributes = True