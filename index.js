const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    const email = socketIdToEmailMap.get(socket.id);
    console.log("user:call", email);

    io.to(to).emit("incomming:call", { from: socket.id, offer, email });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    const email = socketIdToEmailMap.get(socket.id);
    console.log("call:accepted", email);
    io.to(to).emit("call:accepted", { from: socket.id, ans, email });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    // console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    // console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("camera:switched", ({ to }) => {
    const email = socketIdToEmailMap.get(socket.id);
    io.to(to).emit("camera:switched", { from: socket.id, email });
  });

  socket.on("call:ended", ({ to }) => {
    const email = socketIdToEmailMap.get(to);
    emailToSocketIdMap.delete(email);
    socketIdToEmailMap.delete(to);
    io.to(to).emit("call:ended", { from: socket.id });
    console.log(`Socket Disconnected`, to);
  });
});
