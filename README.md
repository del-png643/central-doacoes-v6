# Elo Solidário — Central de Doações (back-end + front-end)

Projeto acadêmico em Python, FastAPI e PostgreSQL (Neon). O FastAPI serve a API **e** o front-end na mesma porta.

## Como executar
1. Abra a pasta `central-doacoes` no VS Code.
2. Crie e ative o ambiente virtual:
   ```bash
   python -m venv .venv
   .venv\Scripts\Activate.ps1      # Windows PowerShell
   source .venv/bin/activate       # Linux/macOS
   ```
3. Instale as dependências: `pip install -r requirements.txt`
4. Copie `.env.example` para `.env` e preencha `DATABASE_URL` (Neon) e `JWT_SECRET`.
5. Inicie tudo com **um único comando**:
   ```bash
   uvicorn app.main:app --reload
   ```
6. Abra no navegador: **http://127.0.0.1:8000** (sistema) ou **http://127.0.0.1:8000/docs** (documentação da API).

## Estrutura
- `app/` — back-end FastAPI (rotas, modelos, segurança)
- `frontend/` — `index.html`, `style.css` e `script.js` (servidos pelo FastAPI)

## Segurança
- Nunca envie o `.env` ao GitHub ou a colegas.
- Cadastro público cria apenas `doador`. Para criar o primeiro administrador, no Neon:
  ```sql
  UPDATE usuarios SET perfil = 'administrador' WHERE email = 'email-autorizado@exemplo.com';
  ```

## Rotas da API
- `POST /auth/cadastro`, `POST /auth/login`, `GET /auth/me`
- `GET /itens`, `POST /itens`, `PATCH /itens/{id}`
- `GET /horarios`, `POST /horarios`
- `GET /agendamentos`, `POST /agendamentos`, `POST /agendamentos/{id}/cancelar`
- `POST /doacoes` — registra o recebimento (administrador)
- `GET /estoque`, `GET /estoque/lotes`, `GET /estoque/movimentacoes`, `POST /estoque/saidas` (administrador)
- `GET /saude`, `GET /api`
