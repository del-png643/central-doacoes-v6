from typing import Annotated
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
from app.security import decode_access_token

bearer = HTTPBearer(auto_error=False)
DbSession = Annotated[Session, Depends(get_db)]

def usuario_atual(db: DbSession, credenciais: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> Usuario:
    erro = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Autenticação necessária.", headers={"WWW-Authenticate": "Bearer"})
    if credenciais is None:
        raise erro
    try:
        payload = decode_access_token(credenciais.credentials)
        usuario_id = int(payload.get("sub", ""))
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise erro
    usuario = db.get(Usuario, usuario_id)
    if usuario is None or not usuario.ativo:
        raise erro
    return usuario

UsuarioAtual = Annotated[Usuario, Depends(usuario_atual)]

def exigir_administrador(usuario: UsuarioAtual) -> Usuario:
    if usuario.perfil != "administrador":
        raise HTTPException(status_code=403, detail="Apenas administradores podem realizar esta operação.")
    return usuario

Administrador = Annotated[Usuario, Depends(exigir_administrador)]
