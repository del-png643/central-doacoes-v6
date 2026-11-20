from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError
from app.database import testar_conexao
from app.routers import agendamentos, auth, doacoes, estoque, horarios, itens

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = FastAPI(
    title="Elo Solidário — Central de Doações",
    description="API para gestão de necessidades, agendamentos, recebimentos e estoque de uma instituição de doações.",
    version="1.2.0",
)

app.include_router(auth.router)
app.include_router(itens.router)
app.include_router(horarios.router)
app.include_router(agendamentos.router)
app.include_router(doacoes.router)
app.include_router(estoque.router)

@app.get("/api", tags=["Sistema"])
def inicio():
    return {"mensagem": "API da Central de Doações funcionando!", "documentacao": "/docs"}

@app.get("/saude", tags=["Sistema"])
def saude():
    try:
        banco = testar_conexao()
        return {"status": "ok", "banco": banco}
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="Banco de dados indisponível.")

@app.get("/teste-banco", tags=["Sistema"])
def teste_banco():
    try:
        banco = testar_conexao()
        return {
            "status": "ok",
            "mensagem": "Conexão com o banco funcionando!",
            "banco": banco
        }
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível conectar ao banco de dados."
        )

# O front-end é servido pelo próprio FastAPI (mesma porta que a API).
# Esta linha precisa ficar por último, para não sobrepor as rotas acima.
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
