import express from "express";

const app = express();
const port = 3000;

app.use(express.json());

const jogadores = [
  {
    id: 1,
    nome: "Caio Ribeiro",
    posicao: "Meia-armador",
    clube: "Aurora FC",
    numeroCamisa: 10,
    nivelHabilidade: 92,
    peDominante: "Direito"
  },
  {
    id: 2,
    nome: "Bruno Costa",
    posicao: "Atacante",
    clube: "Estrela do Sul",
    numeroCamisa: 9,
    nivelHabilidade: 89,
    peDominante: "Esquerdo"
  },
  {
    id: 3,
    nome: "Miguel Santos",
    posicao: "Goleiro",
    clube: "Real Horizonte",
    numeroCamisa: 1,
    nivelHabilidade: 95,
    peDominante: "Direito"
  }
];

let proximoId = 4;

const camposObrigatorios = ["nome", "posicao", "clube", "numeroCamisa", "nivelHabilidade", "peDominante"];

function validarJogador(dados) {
  const camposAusentes = camposObrigatorios.filter(
    (campo) => dados[campo] === undefined || dados[campo] === ""
  );

  if (camposAusentes.length > 0) {
    return `Informe os campos: ${camposAusentes.join(", ")}`;
  }

  if (!Number.isInteger(dados.numeroCamisa) || dados.numeroCamisa < 1 || dados.numeroCamisa > 99) {
    return "numeroCamisa deve ser um numero inteiro entre 1 e 99";
  }

  if (!Number.isInteger(dados.nivelHabilidade) || dados.nivelHabilidade < 0 || dados.nivelHabilidade > 100) {
    return "nivelHabilidade deve ser um numero inteiro entre 0 e 100";
  }

  return null;
}

app.get("/", (req, res) => {
  res.json({
    mensagem: "Servidor Express funcionando!",
    projeto: "Catalogo de Jogadores de Futebol",
    descricao: "Cadastro de jogadores, clubes, posicoes e habilidades em campo."
  });
});

app.get("/jogadores", (req, res) => {
  res.json(jogadores);
});

app.get("/jogadores/:id", (req, res) => {
  const id = Number(req.params.id);

  const jogador = jogadores.find((item) => item.id === id);

  if (!jogador) {
    return res.status(404).json({
      mensagem: "Jogador nao encontrado"
    });
  }

  res.json(jogador);
});

app.post("/jogadores", (req, res) => {
  const erro = validarJogador(req.body);

  if (erro) {
    return res.status(400).json({ mensagem: erro });
  }

  const novoJogador = {
    id: proximoId++,
    nome: req.body.nome,
    posicao: req.body.posicao,
    clube: req.body.clube,
    numeroCamisa: req.body.numeroCamisa,
    nivelHabilidade: req.body.nivelHabilidade,
    peDominante: req.body.peDominante
  };

  jogadores.push(novoJogador);

  res.status(201).json({
    mensagem: "Jogador cadastrado com sucesso",
    jogador: novoJogador
  });
});

app.put("/jogadores/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = jogadores.findIndex((item) => item.id === id);

  if (indice === -1) {
    return res.status(404).json({ mensagem: "Jogador nao encontrado" });
  }

  const jogadorAtualizado = { id, ...req.body };
  const erro = validarJogador(jogadorAtualizado);

  if (erro) {
    return res.status(400).json({ mensagem: erro });
  }

  jogadores[indice] = {
    id,
    nome: jogadorAtualizado.nome,
    posicao: jogadorAtualizado.posicao,
    clube: jogadorAtualizado.clube,
    numeroCamisa: jogadorAtualizado.numeroCamisa,
    nivelHabilidade: jogadorAtualizado.nivelHabilidade,
    peDominante: jogadorAtualizado.peDominante
  };

  res.json({
    mensagem: "Jogador atualizado com sucesso",
    jogador: jogadores[indice]
  });
});

app.delete("/jogadores/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = jogadores.findIndex((item) => item.id === id);

  if (indice === -1) {
    return res.status(404).json({ mensagem: "Jogador nao encontrado" });
  }

  const [jogadorRemovido] = jogadores.splice(indice, 1);

  res.json({
    mensagem: "Jogador removido com sucesso",
    jogador: jogadorRemovido
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
