from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from app.dependencies import DbSession, UsuarioAtual
from app.models import Usuario
from app.schemas import LoginEntrada, TokenSaida, UsuarioCadastro, UsuarioSaida
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post("/cadastro", response_model=UsuarioSaida, status_code=status.HTTP_201_CREATED)
def cadastrar(dados: UsuarioCadastro, db: DbSession):
    email = str(dados.email).lower()
    if db.scalar(select(Usuario).where(Usuario.email == email)):
        raise HTTPException(status_code=409, detail="Já existe uma conta com este e-mail.")
    usuario = Usuario(nome=dados.nome.strip(), email=email, senha_hash=hash_password(dados.senha), telefone=dados.telefone, perfil="doador", ativo=True)
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario

@router.post("/login", response_model=TokenSaida)
def login(dados: LoginEntrada, db: DbSession):
    usuario = db.scalar(select(Usuario).where(Usuario.email == str(dados.email).lower()))
    if usuario is None or not usuario.ativo or not verify_password(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
    return TokenSaida(access_token=create_access_token(usuario.id, usuario.perfil))

@router.get("/me", response_model=UsuarioSaida)
def meu_perfil(usuario: UsuarioAtual):
    return usuario
