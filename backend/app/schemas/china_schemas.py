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
    
    ## Valores por defecto (actualizados):
    - **Entrenamiento**: 2013-2020
    - **Predicción**: 2021-2025 (5 años)
    - **Modelo**: Auto-selección
    - **Forzar rango**: Sí
    
    ## Para usar datos completos (1991-2020):
    ```json
    {
        "indicador": "gdp_usd",
        "anio_inicio_entrenamiento": 1991,
        "anios_prediccion": 10,
        "forzar_rango": true
    }
    ```
    """
    
    indicador: str = Field(
        ...,
        description="Nombre del indicador a predecir (ej: 'gdp_usd', 'population')",
        example="gdp_usd"
    )
    
    modelo: ModeloML = Field(
        default=ModeloML.AUTO,
        description="Modelo de ML a utilizar para la predicción",
        example="auto"
    )
    
    horizonte: HorizontePrediccion = Field(
        default=HorizontePrediccion.CORTO_PLAZO,  # ✅ CAMBIADO: de COMPLETO a CORTO_PLAZO
        description="Horizonte temporal de la predicción (default: corto_plazo - 5 años)",
        example="corto_plazo"
    )
    
    incluir_metricas: bool = Field(
        default=True,
        description="Incluir métricas de evaluación del modelo",
        example=True
    )
    
    # ✅ NUEVOS PARÁMETROS CON VALORES POR DEFECTO PARA 2013-2020
    anio_inicio_entrenamiento: int = Field(
        default=2013,  # ✅ CAMBIADO: de 1991 a 2013
        ge=1990,
        le=2020,
        description="Año de inicio para el entrenamiento del modelo (default: 2013, mínimo: 1990, máximo: 2020)"
    )
    
    anios_prediccion: Optional[int] = Field(
        default=5,  # ✅ CAMBIADO: de None a 5 (para 2021-2025)
        ge=1,
        le=20,
        description="Número de años a predecir. Si no se especifica, se usará el valor del horizonte (default: 5 años, 2021-2025)"
    )
    
    forzar_rango: bool = Field(
        default=True,  # ✅ CAMBIADO: de False a True
        description="Si es True, se usará exactamente el año de inicio especificado. "
                   "Si es False y no hay datos desde ese año, se usará el primer año con datos disponibles. (default: True)",
        example=True
    )
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "indicador": "gdp_usd",
                "modelo": "auto",
                "horizonte": "corto_plazo",  # ✅ Actualizado
                "incluir_metricas": True,
                # ✅ Valores por defecto para 2013-2020 → 2021-2025
                "anio_inicio_entrenamiento": 2013,
                "anios_prediccion": 5,
                "forzar_rango": True
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
    
    # ✅ PARÁMETROS DE RANGO PARA BATCH PREDICTION
    anio_inicio_entrenamiento: Optional[int] = Field(
        default=2013,
        ge=1990,
        le=2020,
        description="Año de inicio para el entrenamiento del modelo (default: 2013)"
    )
    
    anios_prediccion: Optional[int] = Field(
        default=5,
        ge=1,
        le=20,
        description="Número de años a predecir (default: 5)"
    )
    
    forzar_rango: Optional[bool] = Field(
        default=True,
        description="Forzar el uso del año de inicio especificado (default: True)"
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
            "rango_entrenamiento": "2013-2020",  # ✅ Actualizado
            "horizonte_prediccion": "2021-2025",  # ✅ Actualizado
            "total_años_entrenamiento": 8,  # ✅ Actualizado
            "anio_inicio_entrenamiento": 2013,  # ✅ Nuevo campo
            "anios_prediccion": 5,  # ✅ Nuevo campo
            "ultima_actualizacion": "2024-01-15T10:30:00Z",
            "tiempo_procesamiento_segundos": 2.34,
            "modelo_seleccionado": "auto",
            "calidad_datos": "excelente",
            "configuracion_solicitud": {  # ✅ Nuevo campo
                "anio_inicio_solicitado": 2013,
                "forzar_rango": True,
                "horizonte_solicitado": "corto_plazo"
            }
        }
    )
    
    # Resumen ejecutivo
    resumen: Dict[str, Any] = Field(
        ...,
        description="Resumen ejecutivo de las predicciones",
        example={
            "valor_2013": 9570406235659.64,  # ✅ Nuevo campo
            "valor_2020": 14687673892882.0,  # ✅ Renombrado de valor_final_2020
            "valor_2025": 17900034669738.75,  # ✅ Nuevo campo (predicción 2025)
            "crecimiento_2013_2020_pct": 53.5,  # ✅ Nuevo campo
            "crecimiento_2020_2025_pct": 21.9,  # ✅ Nuevo campo
            "crecimiento_total_2013_2025_pct": 87.1,  # ✅ Nuevo campo
            "cagr_2013_2025": 5.4,  # ✅ Nuevo campo
            "tendencia_principal": "crecimiento_moderado",
            "años_entrenamiento": "2013-2020",  # ✅ Nuevo campo
            "años_prediccion": "2021-2025",  # ✅ Nuevo campo
            "rango_completo": "2013-2025"  # ✅ Nuevo campo
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
            "indicadores_procesados": 3,
            "modelo_utilizado": "random_forest",
            "horizonte_prediccion": "2021-2025",
            "anio_inicio_entrenamiento": 2013,
            "anios_prediccion": 5,
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
    
    # ✅ PARÁMETROS DE RANGO PARA ENTRENAMIENTO
    anio_inicio_entrenamiento: Optional[int] = Field(
        default=2013,
        ge=1990,
        le=2020,
        description="Año de inicio para el entrenamiento del modelo (default: 2013)"
    )
    
    forzar_rango: Optional[bool] = Field(
        default=True,
        description="Forzar el uso del año de inicio especificado (default: True)"
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
    
    # ✅ NUEVOS CAMPOS PARA RANGO DE ENTRENAMIENTO
    rango_entrenamiento: Optional[str] = Field(
        default="2013-2020",
        description="Rango de años utilizado para el entrenamiento",
        example="2013-2020"
    )
    
    total_años_entrenamiento: Optional[int] = Field(
        default=8,
        description="Número total de años utilizados para el entrenamiento",
        example=8
    )
    
    anio_inicio_entrenamiento: Optional[int] = Field(
        default=2013,
        description="Año de inicio utilizado para el entrenamiento",
        example=2013
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
    
    # ✅ NUEVO CAMPO PARA RANGO RECOMENDADO
    rango_entrenamiento_recomendado: Optional[str] = Field(
        default="2013-2020",
        description="Rango de entrenamiento recomendado para este modelo",
        example="2013-2020"
    )
    
    # ✅ NUEVO CAMPO PARA DATOS MÍNIMOS
    años_minimos_entrenamiento: Optional[int] = Field(
        default=5,
        description="Número mínimo de años requeridos para entrenamiento",
        example=5
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
                "precision_esperada": 0.95,
                "rango_recomendado": "2013-2020",  # ✅ Nuevo campo
                "años_disponibles": "2013-2020"  # ✅ Nuevo campo
            }
        ]
    )
    
    total_predecibles: int = Field(
        ...,
        description="Número total de indicadores predecibles",
        example=12
    )
    
    # ✅ NUEVO CAMPO PARA INFORMACIÓN DE RANGO POR DEFECTO
    rango_prediccion_default: Dict[str, Any] = Field(
        default={
            "entrenamiento": "2013-2020",
            "prediccion": "2021-2025",
            "descripcion": "Rango por defecto para predicciones"
        },
        description="Configuración de rango por defecto para todas las predicciones"
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
    
    # ✅ NUEVO CAMPO PARA ERRORES DE RANGO
    rango_sugerido: Optional[Dict[str, Any]] = Field(
        None,
        description="Rango sugerido si hubo un error relacionado con el rango de datos",
        example={
            "anio_minimo_disponible": 1991,
            "anio_maximo_disponible": 2020,
            "años_totales_disponibles": 30,
            "rango_sugerido": "1991-2020"
        }
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
    
    # ✅ NUEVO CAMPO PARA CONFIGURACIÓN DE RANGO
    configuracion_rango_default: Dict[str, Any] = Field(
        default={
            "anio_inicio_entrenamiento": 2013,
            "anios_prediccion_default": 5,
            "forzar_rango_default": True,
            "descripcion": "Configuración por defecto para todas las predicciones"
        },
        description="Configuración de rango por defecto del sistema"
    )
    
    class Config:
        from_attributes = True