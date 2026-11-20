from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from app.dependencies import DbSession, Administrador, UsuarioAtual
from app.models import Item
from app.schemas import ItemAtualizacao, ItemEntrada, ItemSaida

router = APIRouter(prefix="/itens", tags=["Necessidades e itens"])

@router.get("", response_model=list[ItemSaida])
def listar_itens(db: DbSession, usuario: UsuarioAtual, todos: bool = False):
    consulta = select(Item)
    if usuario.perfil != "administrador" or not todos:
        consulta = consulta.where(Item.ativo.is_(True))
    return db.scalars(consulta.order_by(Item.nome)).all()

@router.post("", response_model=ItemSaida, status_code=status.HTTP_201_CREATED)
def criar_item(dados: ItemEntrada, db: DbSession, admin: Administrador):
    item = Item(**dados.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item

@router.patch("/{item_id}", response_model=ItemSaida)
def atualizar_item(item_id: int, dados: ItemAtualizacao, db: DbSession, admin: Administrador):
    item = db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item não encontrado.")
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(item, campo, valor)
    db.commit(); db.refresh(item)
    return item
