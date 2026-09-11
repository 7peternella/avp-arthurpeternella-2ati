import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

const app = express();
const port = Number(process.env.PORT) || 3000;
const jwtSecret = process.env.JWT_SECRET || "chave-local-de-desenvolvimento";
const maxFileSize = 5 * 1024 * 1024;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.join(currentDirectory, "uploads");

fs.mkdirSync(uploadDirectory, { recursive: true });
app.use(express.json());

const pets = [
  { id: 1, nome: "Luna", especie: "cachorro", raca: "Vira-lata", idade: 3, adotado: false },
  { id: 2, nome: "Milo", especie: "gato", raca: "Siamês", idade: 2, adotado: true }
];
let nextPetId = 3;
const usuarios = [];

const sendValidationError = (res, message) => res.status(400).json({ mensagem: message });

const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization ? authorization.split(" ") : [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ mensagem: "Token Bearer não informado" });
  }

  try {
    req.usuario = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ mensagem: "Token inválido ou expirado" });
  }
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
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Apenas imagens JPEG, PNG, GIF ou WEBP são permitidas"));
    }
    callback(null, true);
  }
});

app.get("/", (_req, res) => {
  res.json({ mensagem: "API de cadastro de pets funcionando", documentacao: "/api-docs" });
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
  usuarios.push({ id: usuarios.length + 1, nome, email: email.toLowerCase(), senhaHash });
  res.status(201).json({ mensagem: "Usuário cadastrado com sucesso" });
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  const usuario = usuarios.find((item) => item.email === email?.toLowerCase());
  const senhaValida = usuario && await bcrypt.compare(senha || "", usuario.senhaHash);

  if (!senhaValida) {
    return res.status(401).json({ mensagem: "Email ou senha inválidos" });
  }

  const token = jwt.sign({ id: usuario.id, email: usuario.email }, jwtSecret, { expiresIn: "2h" });
  res.json({ mensagem: "Login realizado com sucesso", token });
});

app.get("/pets", authenticate, (_req, res) => res.json(pets));

app.get("/pets/:id", authenticate, (req, res) => {
  const pet = pets.find((item) => item.id === Number(req.params.id));
  if (!pet) return res.status(404).json({ mensagem: "Pet não encontrado" });
  res.json(pet);
});

app.post("/pets", authenticate, (req, res) => {
  const { nome, especie, raca, idade, adotado = false } = req.body;
  if (!nome || !especie || !raca || idade === undefined) {
    return sendValidationError(res, "Informe nome, espécie, raça e idade");
  }
  if (!Number.isInteger(Number(idade)) || Number(idade) < 0) {
    return sendValidationError(res, "A idade deve ser um número inteiro não negativo");
  }

  const novoPet = { id: nextPetId++, nome, especie, raca, idade: Number(idade), adotado: Boolean(adotado) };
  pets.push(novoPet);
  res.status(201).json({ mensagem: "Pet cadastrado com sucesso", pet: novoPet });
});

app.put("/pets/:id", authenticate, (req, res) => {
  const pet = pets.find((item) => item.id === Number(req.params.id));
  if (!pet) return res.status(404).json({ mensagem: "Pet não encontrado" });

  const { nome, especie, raca, idade, adotado } = req.body;
  if (!nome || !especie || !raca || idade === undefined) {
    return sendValidationError(res, "Informe nome, espécie, raça e idade");
  }
  if (!Number.isInteger(Number(idade)) || Number(idade) < 0) {
    return sendValidationError(res, "A idade deve ser um número inteiro não negativo");
  }

  Object.assign(pet, { nome, especie, raca, idade: Number(idade), adotado: Boolean(adotado) });
  res.json({ mensagem: "Pet atualizado com sucesso", pet });
});

app.delete("/pets/:id", authenticate, (req, res) => {
  const petIndex = pets.findIndex((item) => item.id === Number(req.params.id));
  if (petIndex === -1) return res.status(404).json({ mensagem: "Pet não encontrado" });
  pets.splice(petIndex, 1);
  res.json({ mensagem: "Pet excluído com sucesso" });
});

app.post("/upload", authenticate, (req, res) => {
  upload.single("imagem")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ mensagem: "A imagem deve ter no máximo 5 MB" });
    }
    if (error) return res.status(400).json({ mensagem: error.message });
    if (!req.file) return res.status(400).json({ mensagem: "Envie uma imagem no campo imagem" });
    res.status(201).json({ mensagem: "Imagem enviada com sucesso", arquivo: `/uploads/${req.file.filename}` });
  });
});

app.use("/uploads", express.static(uploadDirectory));

const swaggerDefinition = {
  openapi: "3.0.0",
  info: { title: "API PetCare", version: "1.0.0", description: "API REST para cadastro de pets" },
  servers: [{ url: `http://localhost:${port}` }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      Pet: {
        type: "object",
        required: ["nome", "especie", "raca", "idade"],
        properties: { id: { type: "integer" }, nome: { type: "string" }, especie: { type: "string" }, raca: { type: "string" }, idade: { type: "integer" }, adotado: { type: "boolean" } }
      }
    }
  },
  paths: {
    "/usuarios": { post: { summary: "Cadastrar usuário", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["nome", "email", "senha"], properties: { nome: { type: "string" }, email: { type: "string" }, senha: { type: "string", format: "password" } } } } } }, responses: { 201: { description: "Usuário cadastrado" }, 400: { description: "Dados inválidos" } } } },
    "/login": { post: { summary: "Realizar login e obter JWT", responses: { 200: { description: "Token gerado" }, 401: { description: "Credenciais inválidas" } } } },
    "/pets": {
      get: { summary: "Listar pets", security: [{ bearerAuth: [] }], responses: { 200: { description: "Lista de pets" } } },
      post: { summary: "Cadastrar pet", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/Pet" } } } }, responses: { 201: { description: "Pet cadastrado" } } }
    },
    "/pets/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      get: { summary: "Consultar pet", security: [{ bearerAuth: [] }], responses: { 200: { description: "Pet encontrado" }, 404: { description: "Pet não encontrado" } } },
      put: { summary: "Editar pet", security: [{ bearerAuth: [] }], responses: { 200: { description: "Pet atualizado" } } },
      delete: { summary: "Excluir pet", security: [{ bearerAuth: [] }], responses: { 200: { description: "Pet excluído" } } }
    },
    "/upload": { post: { summary: "Enviar imagem", security: [{ bearerAuth: [] }], requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { imagem: { type: "string", format: "binary" } } } } } }, responses: { 201: { description: "Imagem salva" } } } }
  }
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJSDoc({ definition: swaggerDefinition, apis: [] })));

app.use((error, _req, res, _next) => {
  res.status(500).json({ mensagem: "Erro interno do servidor" });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));
}

export { app, pets, usuarios };
