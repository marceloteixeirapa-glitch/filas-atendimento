const socket = io();
socket.on('connect', () => console.log('Conectado ao servidor'));
socket.on('atualizacao', data => console.log('Estado atualizado:', data));