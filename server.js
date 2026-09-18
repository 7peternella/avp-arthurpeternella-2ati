import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

const app = express();
const port = Number(process.env.PORT) || 3000;
const maxFileSize = 5 * 1024 * 1024;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.join(currentDirectory, "uploads");

fs.mkdirSync(uploadDirectory, { recursive: true });
app.use(express.json());

const jogos = [];
const usuarios = [];

const sendValidationError = (res, message) => res.status(400).json({ mensagem: message });

const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization;
  const [scheme, token, extraPart] = authorization ? authorization.split(" ") : [];

  const usuario = usuarios.find((item) => item.token === token);
  if (scheme !== "Bearer" || !token || extraPart || !usuario) {
    return res.status(401).json({ mensagem: "Token ausente ou inválido" });
  }

  req.usuario = usuario;
  next();
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Apenas imagens JPEG, PNG ou WEBP são permitidas"));
    }
    callback(null, true);
  }
});

app.get("/", (_req, res) => {
  res.json({ mensagem: "API de catálogo de jogos funcionando", documentacao: "/api-docs" });
});

app.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha || senha.length < 6) {
    return sendValidationError(res, "Informe nome, email e senha com pelo menos 6 caracteres");
  }
  if (usuarios.some((usuario) => usuario.email === email.toLowerCase())) {
    return res.status(409).json({ mensagem: "Email já cadastrado" });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  usuarios.push({ id: crypto.randomUUID(), nome, email: email.toLowerCase(), senhaHash, token: null });
  res.status(201).json({ mensagem: "Usuário cadastrado com sucesso" });
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  const usuario = usuarios.find((item) => item.email === email?.toLowerCase());
  const senhaValida = usuario && await bcrypt.compare(senha || "", usuario.senhaHash);

  if (!senhaValida) {
    return res.status(401).json({ mensagem: "Email ou senha inválidos" });
  }

  const token = crypto.randomUUID();
  usuario.token = token;
  res.json({ mensagem: "Login realizado com sucesso", token });
});

app.get("/jogos", authenticate, (_req, res) => res.json(jogos));

app.get("/jogos/:id", authenticate, (req, res) => {
  const jogo = jogos.find((item) => item.id === req.params.id);
  if (!jogo) return res.status(404).json({ mensagem: "Jogo não encontrado" });
  res.json(jogo);
});

app.post("/jogos", authenticate, (req, res) => {
  const { nome, genero, plataforma } = req.body;
  if (!nome || !genero || !plataforma) {
    return sendValidationError(res, "Informe nome, gênero e plataforma");
  }

  const novoJogo = { id: crypto.randomUUID(), nome, genero, plataforma };
  jogos.push(novoJogo);
  res.status(201).json({ mensagem: "Jogo cadastrado com sucesso", jogo: novoJogo });
});

app.put("/jogos/:id", authenticate, (req, res) => {
  const jogo = jogos.find((item) => item.id === req.params.id);
  if (!jogo) return res.status(404).json({ mensagem: "Jogo não encontrado" });

  const { nome, genero, plataforma } = req.body;
  if (!nome || !genero || !plataforma) {
    return sendValidationError(res, "Informe nome, gênero e plataforma");
  }

  Object.assign(jogo, { nome, genero, plataforma });
  res.json({ mensagem: "Jogo atualizado com sucesso", jogo });
});

app.delete("/jogos/:id", authenticate, (req, res) => {
  const jogoIndex = jogos.findIndex((item) => item.id === req.params.id);
  if (jogoIndex === -1) return res.status(404).json({ mensagem: "Jogo não encontrado" });
  jogos.splice(jogoIndex, 1);
  res.json({ mensagem: "Jogo excluído com sucesso" });
});

app.post("/upload", authenticate, (req, res) => {
  upload.single("imagem")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ mensagem: "A imagem deve ter no máximo 5 MB" });
    }
    if (error) return res.status(400).json({ mensagem: error.message });
    if (!req.file) return res.status(400).json({ mensagem: "Envie uma imagem no campo imagem" });
    res.status(201).json({ mensagem: "Imagem enviada com sucesso", arquivo: req.file.filename });
  });
});

app.use("/uploads", express.static(uploadDirectory));

const swaggerDefinition = {
  openapi: "3.0.0",
  info: { title: "API Catálogo de Jogos", version: "1.0.0", description: "API REST para catálogo de jogos" },
  servers: [{ url: `http://localhost:${port}` }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "Token" } },
    schemas: {
      Jogo: {
        type: "object",
        required: ["nome", "genero", "plataforma"],
        properties: { id: { type: "string" }, nome: { type: "string" }, genero: { type: "string" }, plataforma: { type: "string" } }
      }
    }
  },
  paths: {
    "/usuarios": { post: { summary: "Cadastrar usuário", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["nome", "email", "senha"], properties: { nome: { type: "string" }, email: { type: "string" }, senha: { type: "string", format: "password" } } } } } }, responses: { 201: { description: "Usuário cadastrado" }, 400: { description: "Dados inválidos" } } } },
    "/login": { post: { summary: "Realizar login e obter token", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "senha"], properties: { email: { type: "string", format: "email" }, senha: { type: "string", format: "password" } } } } } }, responses: { 200: { description: "Token gerado" }, 401: { description: "Credenciais inválidas" } } } },
    "/jogos": {
      get: { summary: "Listar jogos", security: [{ bearerAuth: [] }], responses: { 200: { description: "Lista de jogos" } } },
      post: { summary: "Cadastrar jogo", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Jogo" } } } }, responses: { 201: { description: "Jogo cadastrado" }, 400: { description: "Dados inválidos" } } }
    },
    "/jogos/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      get: { summary: "Consultar jogo", security: [{ bearerAuth: [] }], responses: { 200: { description: "Jogo encontrado" }, 404: { description: "Jogo não encontrado" } } },
      put: { summary: "Editar jogo", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Jogo" } } } }, responses: { 200: { description: "Jogo atualizado" }, 400: { description: "Dados inválidos" } } },
      delete: { summary: "Excluir jogo", security: [{ bearerAuth: [] }], responses: { 200: { description: "Jogo excluído" }, 404: { description: "Jogo não encontrado" } } }
    },
    "/upload": { post: { summary: "Enviar imagem", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", required: ["imagem"], properties: { imagem: { type: "string", format: "binary" } } } } } }, responses: { 201: { description: "Imagem salva" }, 400: { description: "Arquivo inválido" } } } }
  }
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJSDoc({ definition: swaggerDefinition, apis: [] })));

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({ mensagem: "JSON inválido" });
  }
  res.status(500).json({ mensagem: "Erro interno do servidor" });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));
}

export { app, jogos, usuarios };
