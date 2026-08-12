import express from "express";

const app = express();
const port = 3000;

const alunos = [
  { id: 1, nome: "Augusto", turma: "2TIB" },
  { id: 2, nome: "Gustavo", turma: "2TIB" },
  { id: 3, nome: "Rayssa", turma: "2TIB" },
  { id: 4, nome: "Amanda", turma: "2TIB" },
  { id: 5, nome: "Marcos", turma: "2TIB" },
  { id: 6, nome: "Michelly", turma: "2TIB" },
  { id: 7, nome: "Maria Fernanda", turma: "2TIB" },
  { id: 8, nome: "Fellype", turma: "2TIB" }
];

app.get("/", (req, res) => {
  res.json({
    mensagem: "Servidor Express funcionando!",
    disciplina: "Desenvolvimento de Websites",
    bimestre: "3º bimestre"
  });
});

app.get("/alunos", (req, res) => {
  res.json(alunos);
});

app.get("/alunos/:id", (req, res) => {
  const id = Number(req.params.id);

  const aluno = alunos.find((aluno) => aluno.id === id);

  if (!aluno) {
    return res.status(404).json({
      message: "Aluno não encontrado"
    });
  }

  res.json(aluno);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
