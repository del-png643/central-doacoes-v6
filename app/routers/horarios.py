from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from app.dependencies import DbSession, Administrador, UsuarioAtual
from app.models import Agendamento, Horario
from app.schemas import HorarioEntrada, HorarioSaida

router = APIRouter(prefix="/horarios", tags=["Horários"])

@router.get("", response_model=list[HorarioSaida])
def listar_horarios(db: DbSession, usuario: UsuarioAtual, todos: bool = False):
    consulta = select(Horario)
    if usuario.perfil != "administrador" or not todos:
        consulta = consulta.where(Horario.ativo.is_(True), Horario.fim > func.now())
    return db.scalars(consulta.order_by(Horario.inicio)).all()

@router.post("", response_model=HorarioSaida, status_code=status.HTTP_201_CREATED)
def criar_horario(dados: HorarioEntrada, db: DbSession, admin: Administrador):
    conflito = db.scalar(select(Horario).where(Horario.inicio == dados.inicio, Horario.fim == dados.fim))
    if conflito:
        raise HTTPException(status_code=409, detail="Este horário já está cadastrado.")
    horario = Horario(**dados.model_dump())
    db.add(horario); db.commit(); db.refresh(horario)
    return horario
