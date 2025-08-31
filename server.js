const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// servir arquivos estáticos da pasta public
app.use(express.static("public"));

// rota raiz -> carrega a tela principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ------------------------------
// Lógica simples de filas
let filas = {
  geral: [],
};
let guiches = {};

// Recepção emite senha
app.get("/nova-senha/:fila", (req, res) => {
  const fila = req.params.fila;
  if (!filas[fila]) filas[fila] = [];
  const senha = fila[0].toUpperCase() + (filas[fila].length + 1);
  filas[fila].push(senha);
  io.emit("atualizacao", { filas, guiches });
  res.send({ senha });
});

// Atendente chama próximo
app.get("/chamar/:fila/:guiche", (req, res) => {
  const { fila, guiche } = req.params;
  if (!filas[fila] || filas[fila].length === 0) {
    return res.send({ mensagem: "Fila vazia" });
  }
  const senha = filas[fila].shift();
  guiches[guiche] = senha;
  io.emit("atualizacao", { filas, guiches });
  res.send({ guiche, senha });
});

// Socket.io conexão
io.on("connection", (socket) => {
  console.log("Novo cliente conectado");
  socket.emit("atualizacao", { filas, guiches });
});

server.listen(PORT, () => {
  console.log(`Sistema de Atendimento rodando na porta ${PORT}`);
});
