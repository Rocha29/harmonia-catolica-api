# Harmonia Católica — API

Backend do portal de música litúrgica católica, construído com **Express 5**, TypeScript e **Prisma 5** (SQLite em desenvolvimento).

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Linguagem | TypeScript |
| ORM | Prisma 5 |
| Banco | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (`jsonwebtoken`) |

---

## Rotas

### Autenticação — `/api/auth`
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/registro` | Cadastro de usuário |
| POST | `/api/auth/login` | Login, retorna JWT |
| GET | `/api/auth/me` | Perfil do usuário autenticado |

### Cantos — `/api/cantos`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cantos` | Lista com filtros (`busca`, `estilo`, `momentoMissa`, `limit`, `page`) |
| GET | `/api/cantos/:id` | Detalhe de um canto |
| POST | `/api/cantos` | Cadastrar canto |
| PUT | `/api/cantos/:id` | Atualizar canto |
| DELETE | `/api/cantos/:id` | Remover canto |
| GET | `/api/cantos/saude` | Contagem por status (`dominada`, `geladeira`, `nova`, `estudando`) |
| GET | `/api/cantos/deck` | Cantos do deck de expansão (status ≠ `dominada`) |
| PATCH | `/api/cantos/:id/status` | Atualiza status do canto |

#### Status de repertório
- `nova` — nunca tocada pelo ministério
- `geladeira` — tocada no passado, precisa ser reaquecida
- `estudando` — em processo de aprendizado/ensaio
- `dominada` — dominada pelo ministério

### Setlists — `/api/setlists`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/setlists` | Listar setlists do usuário |
| POST | `/api/setlists` | Criar setlist |
| GET | `/api/setlists/:id` | Detalhe com cantos |
| PUT | `/api/setlists/:id` | Atualizar |
| DELETE | `/api/setlists/:id` | Remover |
| POST | `/api/setlists/:id/cantos` | Adicionar canto à setlist |
| DELETE | `/api/setlists/:id/cantos/:cantoId` | Remover canto da setlist |
| GET | `/api/setlists/publica/:link` | Setlist pública (sem auth) |

### Calendário Litúrgico — `/api/calendario`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/calendario` | Lista por mês/ano |
| GET | `/api/calendario/dia/:data` | Dia específico (`YYYY-MM-DD`) |
| GET | `/api/calendario/proximos/semana` | Próximos 7 dias |
| GET | `/api/calendario/ciclos/listar` | Ciclos litúrgicos disponíveis |
| GET | `/api/calendario/tempos/listar` | Tempos litúrgicos disponíveis |

O calendário computa o tempo litúrgico **localmente** usando o algoritmo de Páscoa de Butcher/Meeus. O texto do evangelho é buscado como best-effort na API pública [evangelizo.org](https://evangelizo.org/) e cacheado no banco.

### Ministérios — `/api/ministerios`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/ministerios/ranking` | Top ministérios por pontuação |
| GET | `/api/ministerios/eventos-proximos` | Eventos dos próximos dias |

---

## Começar

```bash
npm install

# gerar o Prisma client
npx prisma generate

# aplicar schema ao banco (dev)
npx prisma db push

# popular com dados de exemplo
npx ts-node prisma/seed.ts

# rodar em desenvolvimento (porta 3001)
npm run dev
```

> **Nota:** Prisma 5 requer Node 18+. Prisma 6+ requer Node 20+.

---

## Variáveis de ambiente

```env
# .env
DATABASE_URL="file:./dev.db"
JWT_SECRET="seu-segredo-aqui"
PORT=3001
```

---

## Estrutura relevante

```
src/
├── index.ts            # Entry point, middlewares, registro de rotas
└── routes/
    ├── auth.ts         # Autenticação JWT
    ├── cantos.ts       # CRUD + saúde + deck + status
    ├── setlists.ts     # Builder de setlists
    ├── calendario.ts   # Algoritmo litúrgico + Evangelizo API
    └── ministerios.ts  # Comunidade e ranking
prisma/
├── schema.prisma       # Modelos de dados
└── seed.ts             # Seed inicial de cantos
```
