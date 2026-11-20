from datetime import date, datetime
from sqlalchemy import BigInteger, Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    telefone: Mapped[str | None] = mapped_column(String(25))
    perfil: Mapped[str] = mapped_column(String(20), nullable=False, default="doador")
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    agendamentos: Mapped[list["Agendamento"]] = relationship(back_populates="doador", foreign_keys="Agendamento.doador_id")

class Item(Base):
    __tablename__ = "itens"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text)
    unidade: Mapped[str] = mapped_column(String(20), nullable=False, default="unidade")
    necessita_validade: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Horario(Base):
    __tablename__ = "horarios"
    __table_args__ = (CheckConstraint("fim > inicio", name="ck_horarios_fim_maior_inicio"), CheckConstraint("limite_agendamentos > 0", name="ck_horarios_limite_positivo"))
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fim: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    limite_agendamentos: Mapped[int] = mapped_column(Integer, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

class Agendamento(Base):
    __tablename__ = "agendamentos"
    __table_args__ = (CheckConstraint("status IN ('agendado','cancelado','parcial','recebido')", name="ck_agendamentos_status"),)
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    doador_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    horario_id: Mapped[int] = mapped_column(ForeignKey("horarios.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="agendado")
    observacao: Mapped[str | None] = mapped_column(Text)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    cancelado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    doador: Mapped[Usuario] = relationship(back_populates="agendamentos", foreign_keys=[doador_id])
    horario: Mapped[Horario] = relationship()
    doacao: Mapped["Doacao | None"] = relationship(back_populates="agendamento", uselist=False)

class Doacao(Base):
    __tablename__ = "doacoes"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    agendamento_id: Mapped[int | None] = mapped_column(ForeignKey("agendamentos.id"), unique=True)
    doador_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    recebido_por: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="recebida")
    observacao: Mapped[str | None] = mapped_column(Text)
    recebida_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    agendamento: Mapped[Agendamento | None] = relationship(back_populates="doacao")
    itens: Mapped[list["ItemDoacao"]] = relationship(back_populates="doacao", cascade="all, delete-orphan")

class ItemDoacao(Base):
    __tablename__ = "itens_doacao"
    __table_args__ = (CheckConstraint("quantidade > 0", name="ck_itens_doacao_quantidade_positiva"),)
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    doacao_id: Mapped[int] = mapped_column(ForeignKey("doacoes.id"), nullable=False, index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("itens.id"), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    validade: Mapped[date | None] = mapped_column(Date)
    registrado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    doacao: Mapped[Doacao] = relationship(back_populates="itens")
    item: Mapped[Item] = relationship()
    lote: Mapped["LoteEstoque | None"] = relationship(back_populates="item_doacao", uselist=False)

class LoteEstoque(Base):
    __tablename__ = "lotes_estoque"
    __table_args__ = (CheckConstraint("quantidade_atual >= 0", name="ck_lotes_quantidade_nao_negativa"),)
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("itens.id"), nullable=False, index=True)
    item_doacao_id: Mapped[int | None] = mapped_column(ForeignKey("itens_doacao.id"), unique=True)
    quantidade_atual: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    validade: Mapped[date | None] = mapped_column(Date)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    item: Mapped[Item] = relationship()
    item_doacao: Mapped[ItemDoacao | None] = relationship(back_populates="lote")

class MovimentacaoEstoque(Base):
    __tablename__ = "movimentacoes_estoque"
    __table_args__ = (CheckConstraint("tipo IN ('entrada','saida')", name="ck_movimentacoes_tipo"), CheckConstraint("quantidade > 0", name="ck_movimentacoes_quantidade_positiva"))
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("itens.id"), nullable=False, index=True)
    lote_id: Mapped[int | None] = mapped_column(ForeignKey("lotes_estoque.id"))
    responsavel_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    motivo: Mapped[str] = mapped_column(String(255), nullable=False)
    registrada_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    item: Mapped[Item] = relationship()
    lote: Mapped[LoteEstoque | None] = relationship()
    responsavel: Mapped[Usuario] = relationship()
