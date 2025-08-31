// app.js (simplificado)
const socket = io();
socket.on('connect', () => {
  console.log('Conectado ao servidor via WebSocket');
});
socket.on('state:update', (state) => {
  console.log('Estado atualizado:', state);
});
