const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 3000;

app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server);

// Almacenar usuarios conectados (por id)
const users = {};

io.on('connection', (socket) => {
  console.log(`Nuevo cliente conectado: ${socket.id}`);

  // Cuando el cliente envía su nombre
  socket.on('user:setName', (username) => {
    // Normalizar el nombre
    const normalized = username.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    users[socket.id] = normalized || 'Usuario';
    console.log(`Usuario asignado: ${users[socket.id]}`);
  });

  // Evento: unirse a una sala
  socket.on('room:join', (roomName) => {
    socket.join(roomName);
    const user = users[socket.id] || 'Usuario';
    console.log(`${user} se unió a la sala ${roomName}`);
    io.to(roomName).emit('chat:message', `📥 ${user} se unió a la sala.`);
  });

  // Evento: salir de una sala
  socket.on('room:leave', (roomName) => {
    socket.leave(roomName);
    const user = users[socket.id] || 'Usuario';
    console.log(`${user} salió de la sala ${roomName}`);
    io.to(roomName).emit('chat:message', `📤 ${user} salió de la sala.`);
  });

    // Evento: mensaje de chat
    socket.on('chat:message', ({ room, message }) => {
      const user = users[socket.id] || 'Usuario';
      console.log(`Mensaje en ${room} de ${user}: ${message}`);
      io.to(room).emit('chat:message', { user, message });
    });


  // Evento: escribiendo
  socket.on('chat:typing', ({ room }) => {
    const user = users[socket.id] || 'Usuario';
    socket.to(room).emit('chat:typing', `${user} está escribiendo...`);
  });

  // Desconexión
  socket.on('disconnect', () => {
    const user = users[socket.id] || 'Usuario';
    console.log(`Cliente desconectado: ${user}`);
    delete users[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Servidor Express + Socket.IO en http://localhost:${PORT}`);
});
