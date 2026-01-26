from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 📍 CONFIGURACIÓN DE LA BASE DE DATOS

# Usamos SQLite porque es más simple para empezar - crea un archivo .db local
# "sqlite:///./china_analytics.db" significa:
# - sqlite:// → protocolo de SQLite
# - /./ → directorio actual del proyecto  
# - china_analytics.db → nombre del archivo de base de datos
SQLALCHEMY_DATABASE_URL = "sqlite:///./china_analytics.db"



# 🚀 CREAMOS EL "MOTOR" DE LA BASE DE DATOS
# El motor es el punto de entrada principal a la base de datos
# - connect_args={"check_same_thread": False} → necesario para SQLite con FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)



# 🏭 CREAMOS LA FÁBRICA DE SESIONES
# SessionLocal será nuestra fábrica para crear nuevas sesiones de BD
# - autocommit=False → controlamos manualmente cuándo guardar cambios
# - autoflush=False → controlamos manualmente cuándo sincronizar
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



# 📦 CREAMOS LA BASE PARA LOS MODELOS
# Base será la clase padre de la que heredarán todos nuestros modelos de datos
Base = declarative_base()



# 🔄 FUNCIÓN PARA OBTENER SESIONES DE BASE DE DATOS
def get_db():
    """
    Esta función crea y maneja sesiones de base de datos
    Se usa como dependencia en FastAPI para cada request
    """
    # Creamos una nueva sesión
    db = SessionLocal()
    try:
        # "yield" entrega la sesión al endpoint que la necesita
        yield db
    finally:
        # Siempre cerramos la sesión, incluso si hay errores
        # Esto evita fugas de conexiones
        db.close()