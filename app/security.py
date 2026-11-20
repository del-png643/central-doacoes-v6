import os
from datetime import datetime, timedelta, timezone
import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash

load_dotenv()

password_hash = PasswordHash.recommended()
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("A variável JWT_SECRET não foi configurada no arquivo .env.")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
JWT_ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    try:
        return password_hash.verify(password, hashed)
    except Exception:
        return False

def create_access_token(user_id: int, perfil: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "perfil": perfil, "iat": now, "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
