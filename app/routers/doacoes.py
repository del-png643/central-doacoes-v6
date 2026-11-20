from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from app.dependencies import DbSession, Administrador
from app.models import Agendamento, Doacao, Item, ItemDoacao, LoteEstoque, MovimentacaoEstoque
from app.schemas import DoacaoEntrada, DoacaoSaida

router = APIRouter(prefix="/doacoes", tags=["Recebimento de doações"])

@router.post("", response_model=DoacaoSaida, status_code=status.HTTP_201_CREATED)
def registrar_doacao(dados: DoacaoEntrada, db: DbSession, admin: Administrador):
    agendamento = None
    if dados.agendamento_id is not None:
        agendamento = db.scalar(select(Agendamento).where(Agendamento.id == dados.agendamento_id).with_for_update())
        if agendamento is None:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
        if agendamento.status == "cancelado":
            raise HTTPException(status_code=409, detail="Não é possível registrar recebimento para um agendamento cancelado.")
        if agendamento.doacao is not None:
            raise HTTPException(status_code=409, detail="Já existe uma doação registrada para este agendamento.")
        doador_id = agendamento.doador_id
        if dados.doador_id is not None and dados.doador_id != doador_id:
            raise HTTPException(status_code=400, detail="O doador informado não corresponde ao agendamento.")
    else:
        if dados.doador_id is None:
            raise HTTPException(status_code=400, detail="Informe o doador ou um agendamento vinculado.")
        doador_id = dados.doador_id

    ids = {entrada.item_id for entrada in dados.itens}
    itens_cadastrados = {item.id: item for item in db.scalars(select(Item).where(Item.id.in_(ids), Item.ativo.is_(True))).all()}
    if len(itens_cadastrados) != len(ids):
        raise HTTPException(status_code=400, detail="Um ou mais itens não existem ou estão inativos.")
    for entrada in dados.itens:
        item = itens_cadastrados[entrada.item_id]
        if item.necessita_validade and entrada.validade is None:
            raise HTTPException(status_code=400, detail=f"Informe a validade do item '{item.nome}'.")

    doacao = Doacao(agendamento_id=dados.agendamento_id, doador_id=doador_id, recebido_por=admin.id, status=dados.status, observacao=dados.observacao)
    db.add(doacao)
    db.flush()
    for entrada in dados.itens:
        registro_item = ItemDoacao(doacao_id=doacao.id, item_id=entrada.item_id, quantidade=entrada.quantidade, validade=entrada.validade)
        db.add(registro_item)
        db.flush()
        lote = LoteEstoque(item_id=entrada.item_id, item_doacao_id=registro_item.id, quantidade_atual=entrada.quantidade, validade=entrada.validade)
        db.add(lote)
        db.flush()
        db.add(MovimentacaoEstoque(item_id=entrada.item_id, lote_id=lote.id, responsavel_id=admin.id, tipo="entrada", quantidade=entrada.quantidade, motivo=f"Recebimento da doação #{doacao.id}"))
    if agendamento is not None:
        # A doação usa "recebida", mas a restrição da tabela agendamentos aceita "recebido".
        agendamento.status = "recebido" if dados.status == "recebida" else dados.status
    db.commit()
    db.refresh(doacao)
    return doacao
