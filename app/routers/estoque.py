from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from app.dependencies import DbSession, Administrador
from app.models import Item, LoteEstoque, MovimentacaoEstoque
from app.schemas import EstoqueResumo, LoteSaida, MovimentacaoSaida, SaidaEstoqueEntrada

router = APIRouter(prefix="/estoque", tags=["Estoque"])

@router.get("", response_model=list[EstoqueResumo])
def consultar_estoque(db: DbSession, admin: Administrador):
    consulta = (
        select(Item.id.label("item_id"), Item.nome, Item.unidade, func.coalesce(func.sum(LoteEstoque.quantidade_atual), 0).label("quantidade_total"))
        .outerjoin(LoteEstoque, LoteEstoque.item_id == Item.id)
        .where(Item.ativo.is_(True))
        .group_by(Item.id, Item.nome, Item.unidade)
        .order_by(Item.nome)
    )
    return [EstoqueResumo(**row._mapping) for row in db.execute(consulta).all()]

@router.get("/lotes", response_model=list[LoteSaida])
def listar_lotes(db: DbSession, admin: Administrador):
    lotes = db.scalars(
        select(LoteEstoque)
        .options(joinedload(LoteEstoque.item))
        .where(LoteEstoque.quantidade_atual > 0)
        .order_by(LoteEstoque.validade.asc().nulls_last(), LoteEstoque.id)
    ).all()
    return [LoteSaida(id=l.id, item_id=l.item_id, item_nome=l.item.nome, unidade=l.item.unidade, quantidade_atual=l.quantidade_atual, validade=l.validade) for l in lotes]

@router.get("/movimentacoes", response_model=list[MovimentacaoSaida])
def listar_movimentacoes(db: DbSession, admin: Administrador, limite: int = 100):
    limite = max(1, min(limite, 500))
    return db.scalars(select(MovimentacaoEstoque).order_by(MovimentacaoEstoque.registrada_em.desc()).limit(limite)).all()

@router.post("/saidas", response_model=MovimentacaoSaida, status_code=201)
def registrar_saida(dados: SaidaEstoqueEntrada, db: DbSession, admin: Administrador):
    lote = db.scalar(select(LoteEstoque).where(LoteEstoque.id == dados.lote_id).with_for_update())
    if lote is None:
        raise HTTPException(status_code=404, detail="Lote de estoque não encontrado.")
    if dados.quantidade > lote.quantidade_atual:
        raise HTTPException(status_code=409, detail=f"Estoque insuficiente. Quantidade disponível: {lote.quantidade_atual}.")
    lote.quantidade_atual -= dados.quantidade
    movimento = MovimentacaoEstoque(item_id=lote.item_id, lote_id=lote.id, responsavel_id=admin.id, tipo="saida", quantidade=dados.quantidade, motivo=dados.motivo)
    db.add(movimento)
    db.commit(); db.refresh(movimento)
    return movimento
