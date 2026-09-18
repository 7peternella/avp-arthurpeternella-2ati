# Catálogo de Jogos

API REST simples para cadastrar e consultar jogos. O tema do projeto é um catálogo de jogos e os dados ficam em memória em arrays de objetos JavaScript. Ao reiniciar o servidor, os jogos e usuários cadastrados são perdidos.

## Tecnologias

Node.js, Express, bcrypt, multer, swagger-jsdoc e swagger-ui-express.

## Instalação e execução

```bash
npm install
npm start
```

Para desenvolvimento, use `npm run dev`. O servidor utiliza a porta `3000` por padrão. É possível definir outra porta criando um `.env` baseado em `.env.example`.

Swagger: http://localhost:3000/api-docs

## Usuário e login

Cadastre um usuário:

```http
POST /usuarios
Content-Type: application/json

{"nome":"Arthur","email":"arthur@example.com","senha":"123456"}
```

A senha é salva somente com hash bcrypt. Depois, faça login:

```http
POST /login
Content-Type: application/json

{"email":"arthur@example.com","senha":"123456"}
```

Copie o `token` da resposta e envie `Authorization: Bearer TOKEN` nas rotas protegidas. O token é armazenado em memória.

## Rotas principais

| Método | Rota | Proteção | Função |
| --- | --- | --- | --- |
| POST | `/usuarios` | Não | Cadastra usuário |
| POST | `/login` | Não | Gera token |
| POST | `/jogos` | Bearer | Cadastra jogo |
| GET | `/jogos` | Bearer | Lista jogos |
| GET | `/jogos/:id` | Bearer | Consulta jogo |
| PUT | `/jogos/:id` | Bearer | Edita jogo |
| DELETE | `/jogos/:id` | Bearer | Exclui jogo |
| POST | `/upload` | Bearer | Envia imagem no campo `imagem` |
| GET | `/api-docs` | Não | Abre Swagger |

Exemplo de jogo:

```json
{"nome":"Stardew Valley","genero":"simulação","plataforma":"PC"}
```

Depois do login, use o CRUD em `/jogos`. Os IDs são UUIDs, portanto não dependem do tamanho do array. O upload deve ser `multipart/form-data`, com o campo `imagem`, e aceita somente JPEG, PNG ou WEBP de até 5 MB. Os arquivos são salvos em `uploads/` com nomes únicos.

## Testes no Insomnia

1. Faça `POST /usuarios`.
2. Faça `POST /login` e copie o token.
3. Tente `GET /jogos` sem token para verificar o `401`.
4. Repita com `Authorization: Bearer TOKEN` e teste POST, GET por ID, PUT e DELETE.
5. Para upload, selecione `Multipart Form`, crie o campo de arquivo `imagem` e envie uma imagem permitida.