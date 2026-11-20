from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class UsuarioCadastro(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)
    telefone: str | None = Field(default=None, max_length=25)

class UsuarioSaida(ORMModel):
    id: int
    nome: str
    email: EmailStr
    telefone: str | None
    perfil: str
    ativo: bool
    criado_em: datetime

class LoginEntrada(BaseModel):
    email: EmailStr
    senha: str

class TokenSaida(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ItemEntrada(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    descricao: str | None = None
    unidade: str = Field(default="unidade", max_length=20)
    necessita_validade: bool = False
    ativo: bool = True

class ItemAtualizacao(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=120)
    descricao: str | None = None
    unidade: str | None = Field(default=None, max_length=20)
    necessita_validade: bool | None = None
    ativo: bool | None = None

class ItemSaida(ORMModel):
    id: int
    nome: str
    descricao: str | None
    unidade: str
    necessita_validade: bool
    ativo: bool
    criado_em: datetime

class HorarioEntrada(BaseModel):
    inicio: datetime
    fim: datetime
    limite_agendamentos: int = Field(gt=0)
    ativo: bool = True
    @model_validator(mode="after")
    def validar_periodo(self):
        if self.inicio.tzinfo is None or self.fim.tzinfo is None:
            raise ValueError("Informe início e fim com fuso horário, por exemplo -03:00.")
        if self.fim <= self.inicio:
            raise ValueError("O fim do horário deve ser posterior ao início.")
        return self

class HorarioSaida(ORMModel):
    id: int
    inicio: datetime
    fim: datetime
    limite_agendamentos: int
    ativo: bool

class AgendamentoEntrada(BaseModel):
    horario_id: int
    observacao: str | None = None

class UsuarioResumo(ORMModel):
    id: int
    nome: str
    email: EmailStr
    telefone: str | None

class AgendamentoSaida(ORMModel):
    id: int
    doador_id: int
    horario_id: int
    status: str
    observacao: str | None
    criado_em: datetime
    cancelado_em: datetime | None
    horario: HorarioSaida | None = None
    doador: UsuarioResumo | None = None

class ItemRecebidoEntrada(BaseModel):
    item_id: int
    quantidade: int = Field(gt=0)
    validade: date | None = None

class DoacaoEntrada(BaseModel):
    agendamento_id: int | None = None
    doador_id: int | None = None
    status: str = "recebida"
    observacao: str | None = None
    itens: list[ItemRecebidoEntrada] = Field(min_length=1)
    @model_validator(mode="after")
    def validar_status(self):
        if self.status not in {"parcial", "recebida"}:
            raise ValueError("O status deve ser 'parcial' ou 'recebida'.")
        return self

class DoacaoSaida(ORMModel):
    id: int
    agendamento_id: int | None
    doador_id: int
    recebido_por: int
    status: str
    observacao: str | None
    recebida_em: datetime

class SaidaEstoqueEntrada(BaseModel):
    lote_id: int
    quantidade: int = Field(gt=0)
    motivo: str = Field(min_length=2, max_length=255)

class MovimentacaoSaida(ORMModel):
    id: int
    item_id: int
    lote_id: int | None
    responsavel_id: int
    tipo: str
    quantidade: int
    motivo: str
    registrada_em: datetime

class EstoqueResumo(BaseModel):
    item_id: int
    nome: str
    unidade: str
    quantidade_total: int

class LoteSaida(BaseModel):
    id: int
    item_id: int
    item_nome: str
    unidade: str
    quantidade_atual: int
    validade: date | None
