# Task Manager

Aplicação Full Stack para gerenciamento de tarefas, equipes e espaços de trabalho (workspaces). O sistema permite organizar pessoas e atividades em diferentes workspaces, com controle de permissões, convites para novos membros e histórico de alterações das tarefas.

## Demonstração

- **Aplicação:** [Acessar Task-Manager](https://task-manager-six-olive-82.vercel.app/)

## Funcionalidades

### Autenticação e usuários
- Cadastro de usuários e autenticação por e-mail e senha.
- Senhas armazenadas com hash usando bcrypt.
- Autenticação de requisições com JWT.
- Rotas protegidas por middleware de autenticação.

### Workspaces e membros
- Criação e listagem de workspaces.
- Papéis de acesso por workspace: `Admin` e `Member`.
- Convites de membros por e-mail.
- Tokens de convite armazenados como hash e com validade de 48 horas.
- Aceitação, consulta e cancelamento de convites.
- Gerenciamento de membros e atualização de permissões.

### Equipes
- Criação, edição e listagem de equipes.
- Associação e remoção de membros.
- Ativação e desativação de equipes, preservando os registros.

### Tarefas
- Criação, consulta, edição e exclusão de tarefas.
- Atribuição de tarefas a usuários e equipes.
- Organização por status: `Pendente`, `Em_progresso` e `Concluído`.
- Definição de prioridade: `Alta`, `Média` e `Baixa`.
- Histórico de alterações de status, com identificação de quem realizou a mudança.

## Tecnologias

**Front-end**
- React 19, TypeScript, Vite e Tailwind CSS
- React Router e Axios
- React Hook Form e Zod

**Back-end**
- Node.js, TypeScript e Express
- Prisma ORM e PostgreSQL
- JWT, bcrypt e Zod

**Qualidade e ambiente**
- Jest e Supertest
- Docker Compose
- tsup e tsx

## Estrutura do projeto

```text
Task-Manager/
├── BackEnd/
│   ├── prisma/
│   ├── src/
│   │   ├── controller/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── tests/
│   └── docker-compose.yml
└── FrontEnd/
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        ├── routes/
        └── services/
```

## Executar localmente

### Pré-requisitos
- Node.js e npm
- Docker e Docker Compose (ou uma instância PostgreSQL disponível)

### 1. Clonar o repositório

```bash
git clone https://github.com/philipipastor/Task-Manager.git
cd Task-Manager
```

### 2. Configurar o Back-end

```bash
cd BackEnd
npm install
```

Crie um arquivo `.env` dentro de `BackEnd/`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/TaskMeneger?schema=public"
JWT_SECRET="sua-chave-secreta"
PORT=3333
```

Suba o PostgreSQL com Docker Compose:

```bash
docker compose up -d
```

Gere o Prisma Client, execute as migrations e inicie a API:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

A API ficará disponível localmente na porta `3333`, salvo configuração diferente em `PORT`.

### 3. Configurar o Front-end

Em outro terminal:

```bash
cd FrontEnd
npm install
```

Crie o arquivo `.env.development`:

```env
VITE_API_URL=http://localhost:3333
```

Inicie a aplicação:

```bash
npm run dev
```

O Vite exibirá no terminal o endereço local para acessar o Front-end.

## Scripts

### Back-end

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia a API em modo de desenvolvimento |
| `npm test` | Executa os testes automatizados |
| `npm run test:dev` | Executa os testes em modo watch (script configurado para Windows) |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm run build` | Gera a versão compilada |
| `npm start` | Inicia a versão compilada |

### Front-end

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Executa a verificação TypeScript e gera o build |
| `npm run preview` | Pré-visualiza o build de produção |

## Endpoints principais

Todas as rotas, exceto o login e o cadastro de usuário, exigem autenticação quando indicado no código.

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/users` | Cadastro de usuário |
| GET | `/users` | Listagem de usuários (autenticado) |
| POST | `/session` | Login |
| GET / POST | `/workspace` | Listar e criar workspaces |
| POST | `/workspace/:workSpaceId/invites` | Criar convite |
| GET | `/workspace/:workSpaceId/invites` | Listar convites |
| POST | `/workspace/invites/accept` | Aceitar convite |
| DELETE | `/workspace/:workSpaceId/invites/:inviteId` | Cancelar convite |
| PATCH / DELETE | `/workspace/:workSpaceId/members/:userId` | Atualizar ou remover membro |
| GET / POST | `/teams` | Listar e criar equipes |
| PUT | `/teams/:id` | Atualizar equipe |
| PATCH | `/teams/:id/active` | Ativar equipe |
| PATCH | `/teams/:id/desactive` | Desativar equipe |
| POST / GET | `/members` | Associar membro à equipe / listar membros por equipe |
| DELETE | `/members/:team_id` | Remover associação de membros da equipe |
| GET / POST | `/tasks` | Listar e criar tarefas |
| GET / PATCH / DELETE | `/tasks/:id` | Consultar, atualizar ou excluir tarefa |
| GET | `/tasks/history/:id` | Consultar histórico da tarefa |

## Testes

O Back-end possui testes automatizados com Jest e Supertest para funcionalidades de tarefas, equipes, usuários, workspaces e convites.

Execute a suíte com:

```bash
cd BackEnd
npm test
```

---

Desenvolvido por **Philipi Pastor**.

[GitHub](https://github.com/philipipastor)
