const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: {
    origin: "*",
  },
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // Handle Room Joining
  socket.on("room:join", ({ email, room }) => {
    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);
    
    socket.join(room);
    io.to(room).emit("user:joined", { email, id: socket.id });
    io.to(socket.id).emit("room:join", { room });

    console.log(`User ${email} joined room ${room}`);
  });

  // Handle User Calling
  socket.on("user:call", ({ to, offer }) => {
    console.log(`Call initiated from ${socket.id} to ${to}`);
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  // Handle Call Acceptance
  socket.on("call:accepted", ({ to, ans }) => {
    console.log(`Call accepted by ${to}`);
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  // Handle ICE Candidate Exchange
  socket.on("peer:ice-candidate", ({ to, candidate }) => {
    console.log(`ICE candidate sent from ${socket.id} to ${to}`);
    io.to(to).emit("peer:ice-candidate", { from: socket.id, candidate });
  });

  // Handle Peer Negotiation
  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log(`Negotiation needed from ${socket.id} to ${to}`);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log(`Negotiation done from ${socket.id} to ${to}`);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  // Handle Disconnection
  socket.on("disconnect", () => {
    const email = socketIdToEmailMap.get(socket.id);
    emailToSocketIdMap.delete(email);
    socketIdToEmailMap.delete(socket.id);
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

console.log("WebRTC Signaling Server Running on Port 8000");
