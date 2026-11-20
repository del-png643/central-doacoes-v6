import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "A variável DATABASE_URL não foi configurada no arquivo .env. "
        "Copie .env.example para .env e configure a conexão do Neon."
    )

class Base(DeclarativeBase):
    pass

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"connect_timeout": 10},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def testar_conexao() -> str:
    with engine.connect() as conexao:
        return conexao.execute(text("SELECT current_database()")).scalar_one()
