from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from app.dependencies import DbSession, Administrador, UsuarioAtual
from app.models import Agendamento, Horario
from app.schemas import AgendamentoEntrada, AgendamentoSaida

router = APIRouter(prefix="/agendamentos", tags=["Agendamentos"])

def _com_relacoes():
    # Carrega horário e doador junto, para o front exibir data/hora e nome sem novas chamadas.
    return select(Agendamento).options(joinedload(Agendamento.horario), joinedload(Agendamento.doador))

@router.post("", response_model=AgendamentoSaida, status_code=status.HTTP_201_CREATED)
def criar_agendamento(dados: AgendamentoEntrada, db: DbSession, usuario: UsuarioAtual):
    horario = db.scalar(select(Horario).where(Horario.id == dados.horario_id).with_for_update())
    if horario is None or not horario.ativo or horario.inicio <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="O horário não está disponível para agendamento.")
    ocupadas = db.scalar(select(func.count(Agendamento.id)).where(Agendamento.horario_id == horario.id, Agendamento.status == "agendado")) or 0
    if ocupadas >= horario.limite_agendamentos:
        raise HTTPException(status_code=409, detail="Este horário atingiu o limite de agendamentos.")
    agendamento = Agendamento(doador_id=usuario.id, horario_id=horario.id, observacao=dados.observacao, status="agendado")
    db.add(agendamento); db.commit()
    return db.scalar(_com_relacoes().where(Agendamento.id == agendamento.id))

@router.get("", response_model=list[AgendamentoSaida])
def listar_agendamentos(db: DbSession, usuario: UsuarioAtual):
    consulta = _com_relacoes()
    if usuario.perfil != "administrador":
        consulta = consulta.where(Agendamento.doador_id == usuario.id)
    return db.scalars(consulta.order_by(Agendamento.criado_em.desc())).all()

@router.post("/{agendamento_id}/cancelar", response_model=AgendamentoSaida)
def cancelar_agendamento(agendamento_id: int, db: DbSession, usuario: UsuarioAtual):
    agendamento = db.get(Agendamento, agendamento_id)
    if agendamento is None:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
    if usuario.perfil != "administrador" and agendamento.doador_id != usuario.id:
        raise HTTPException(status_code=403, detail="Você só pode cancelar seus próprios agendamentos.")
    if agendamento.status != "agendado":
        raise HTTPException(status_code=409, detail="Somente agendamentos ainda agendados podem ser cancelados.")
    agendamento.status = "cancelado"
    agendamento.cancelado_em = datetime.now(timezone.utc)
    db.commit()
    return db.scalar(_com_relacoes().where(Agendamento.id == agendamento.id))
