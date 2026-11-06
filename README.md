# Controle de Estoque — Laboratório Docker Compose

Gerencie produtos, quantidades e preços de uma pequena loja.

## Objetivo

O código da aplicação já está pronto. **O aluno não precisa desenvolver nem modificar o sistema.** A tarefa é criar `Dockerfile`, `.dockerignore` e `compose.yaml` para implantar esta aplicação com Node.js e PostgreSQL em containers separados.

## Arquivos fornecidos

- `server.js`: API REST com Express e acesso ao PostgreSQL.
- `db` não é um arquivo separado: a conexão com o banco está configurada no `server.js`.
- `config.json`: configuração da interface e dos campos.
- `public/`: interface HTML/CSS/JavaScript.
- `database/init.sql`: criação da tabela e registros iniciais.
- `.env.example`: variáveis de ambiente de referência.
- `package.json`: dependências e comando de execução.

## Requisitos da infraestrutura

1. Construir uma imagem Node.js própria usando um **Dockerfile**. O comando para iniciar a API é `npm start`; a aplicação atende pela porta interna `3000`.
2. Usar imagem oficial PostgreSQL (sugestão `postgres:16`). Criar o banco `laboratorio`, usuário `appuser` e definir a senha escolhida no laboratório.
3. Informar à aplicação as variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` e, opcionalmente, `PORT`. **No Compose, `DB_HOST` deve ser o nome do serviço PostgreSQL (por exemplo, `db`), não `localhost`.**
4. Montar o arquivo `database/init.sql` em `/docker-entrypoint-initdb.d/init.sql` no container do PostgreSQL, como somente leitura. O SQL somente é executado automaticamente quando o volume de dados está vazio.
5. Criar uma rede `bridge` compartilhada pelos dois serviços.
6. Criar um volume nomeado persistente montado em `/var/lib/postgresql/data` no PostgreSQL (para PostgreSQL 16).
7. Publicar apenas a porta web da API (sugestão `3000:3000`). Não é necessário publicar a porta do PostgreSQL no host.
8. Configurar `depends_on` e, preferencialmente, um `healthcheck` para aguardar o banco ficar pronto.

## Endereços / API

- Interface web: `http://localhost:3000`
- Teste de saúde: `http://localhost:3000/api/health`
- Lista: `GET /api/itens`
- Criar: `POST /api/itens`
- Atualizar: `PUT /api/itens/:id`
- Excluir: `DELETE /api/itens/:id`

## Demonstração em aula

- Subir com `docker compose up -d --build`.
- Mostrar `docker compose ps`, `docker network ls` e `docker volume ls`.
- Abrir a interface e apresentar os seguintes testes:
- Cadastrar um produto novo
- Atualizar a quantidade após uma venda
- Excluir um produto
- Mostrar o cadastro após recriar containers
- Executar `docker compose down` e depois `docker compose up -d` para demonstrar persistência.

**A avaliação é presencial/prática: não há entrega de código-fonte, Dockerfile ou compose.yaml ao professor.** O aluno precisa ter os arquivos no seu ambiente para executar a aplicação, mas deve somente mostrar o funcionamento.

## Teste local opcional (sem Docker)

Com um PostgreSQL já configurado e com `database/init.sql` aplicado ao banco vazio:

```bash
npm install
cp .env.example .env
# Edite as variáveis no .env para apontar ao PostgreSQL local.
npm start
```

Depois acesse `http://localhost:3000`. Não utilize a senha de exemplo fora do laboratório.

## Atenção

- Se já existir um volume de PostgreSQL de outra atividade, use um volume novo para garantir que o `init.sql` seja aplicado.
- Em ambientes reais, não versionar credenciais no YAML: usar gerenciadores de segredos ou variáveis seguras.
- Este é um exemplo didático de CRUD, sem autenticação nem autorização, destinado a laboratórios locais.
