# API PetCare

API REST desenvolvida com Node.js e Express para o cadastro de pets. O projeto usa armazenamento em memória, portanto os dados são perdidos quando o servidor é encerrado.

## Como executar

```bash
npm install
cp .env.example .env
npm start
```

Servidor: `http://localhost:3000`  
Documentação Swagger: `http://localhost:3000/api-docs`

## Autenticação

1. `POST /usuarios` com `{ "nome": "Arthur", "email": "arthur@example.com", "senha": "123456" }`.
2. `POST /login` com email e senha.
3. Copie o token retornado e use o cabeçalho `Authorization: Bearer TOKEN` nas rotas protegidas.

As senhas são armazenadas com hash bcrypt e nunca são retornadas pela API.

## Rotas

| Método | Rota | Proteção | Função |
| --- | --- | --- | --- |
| POST | `/usuarios` | Não | Cadastra usuário |
| POST | `/login` | Não | Gera token JWT |
| GET | `/pets` | Bearer | Lista pets |
| GET | `/pets/:id` | Bearer | Consulta um pet |
| POST | `/pets` | Bearer | Cadastra pet |
| PUT | `/pets/:id` | Bearer | Edita pet |
| DELETE | `/pets/:id` | Bearer | Exclui pet |
| POST | `/upload` | Bearer | Envia imagem no campo `imagem` |
| GET | `/api-docs` | Não | Abre documentação Swagger |

O upload aceita somente JPEG, PNG, GIF ou WEBP com até 5 MB. Os arquivos são salvos localmente na pasta `uploads/`.

## Demonstração no Insomnia

Teste primeiro o cadastro e o login. Depois faça uma requisição `GET /pets` sem o cabeçalho para demonstrar o bloqueio (`401`) e repita com o token para demonstrar o acesso. Em seguida, execute POST, GET por ID, PUT e DELETE. Para o upload, use `Multipart Form`, campo `imagem` do tipo arquivo.