const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const rooms = new Map();

app.use(express.static("Public"));
app.get("/health", (_req, res) => res.json({ ok: true }));

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (rooms.has(code));
  return code;
}
function roomPlayers(room) {
  return [...room.players.values()].map(p => ({
    id: p.id, name: p.name, score: p.score || 0, alive: p.alive !== false
  }));
}
function broadcastRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  io.to(code).emit("room-update", { roomCode: code, players: roomPlayers(room) });
}
function cleanName(value) {
  return String(value || "Runner").replace(/[<>]/g, "").trim().slice(0, 16) || "Runner";
}

io.on("connection", socket => {
  socket.on("create-room", ({ name } = {}) => {
    // Remove this socket from any previous room first.
    leaveRoom(socket);
    const code = makeCode();
    const room = { players: new Map(), createdAt: Date.now() };
    rooms.set(code, room);
    room.players.set(socket.id, { id: socket.id, name: cleanName(name), score: 0, alive: true });
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit("room-created", { roomCode: code });
    socket.emit("room-joined", { roomCode: code, players: roomPlayers(room) });
    broadcastRoom(code);
  });

  socket.on("join-room", ({ roomCode, name } = {}) => {
    const code = String(roomCode || "").toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return socket.emit("room-error", "Room not found. Check the code or create a new room.");
    if (room.players.size >= 8 && !room.players.has(socket.id))
      return socket.emit("room-error", "This room is full (maximum 8 players).");
    leaveRoom(socket);
    room.players.set(socket.id, { id: socket.id, name: cleanName(name), score: 0, alive: true });
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit("room-joined", { roomCode: code, players: roomPlayers(room) });
    broadcastRoom(code);
  });

  socket.on("game-state", ({ roomCode, score, alive } = {}) => {
    const code = String(roomCode || "").toUpperCase();
    if (socket.data.roomCode !== code) return;
    const room = rooms.get(code);
    const player = room && room.players.get(socket.id);
    if (!player) return;
    player.score = Math.max(0, Math.min(100000000, Number(score) || 0));
    player.alive = Boolean(alive);
    socket.to(code).emit("player-state", { id: socket.id, score: player.score, alive: player.alive });
    // Roster is authoritative; periodic updates let everyone see live scores.
    if (Math.floor(player.score) % 10 === 0) broadcastRoom(code);
  });

  socket.on("disconnect", () => leaveRoom(socket));
  function leaveRoom(s) {
    const code = s.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (room) {
      room.players.delete(s.id);
      if (room.players.size === 0) rooms.delete(code);
      else broadcastRoom(code);
    }
    s.leave(code);
    delete s.data.roomCode;
  }
});

// Periodically clean up stale empty rooms.
setInterval(() => {
  for (const [code, room] of rooms) {
    if (room.players.size === 0 || Date.now() - room.createdAt > 6 * 60 * 60 * 1000 && room.players.size === 0) rooms.delete(code);
  }
}, 60_000).unref();

server.listen(PORT, () => console.log(`RUN RUSH multiplayer server listening on port ${PORT}`));
