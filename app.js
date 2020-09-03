require("dotenv").config();
const express = require("express");
const socketIO = require("socket.io");
const app = express();
const http = require("http");
const port = process.env.PORT || 5000;
let path = require("path");
//const cors = require("cors");

const roomHandler = require("./scripts/roomHandler");
const messageHandler = require("./scripts/messageHandler");

let server = http.createServer(app);
let io = socketIO(server);

// socket logic
io.on("connection", async (socket) => {
  console.log("new connection established");

  socket.on("createRoom", async (client) => {
    roomHandler.createRoom(client.code, client.topic);
  });

  socket.on("joinRoom", async (client) => {
    const roomJoined = await roomHandler.enterRoom(client.code);

    // found the room, join it and set up socket
    if (roomJoined) {
      socket.room = roomJoined.room;
      socket.colour = roomJoined.colour;
      socket.userId = client.userId;
      socket.join(socket.room.roomCode);
      socket.emit("roomJoined", {
        room: socket.room,
        userId: socket.userId,
        admin: messageHandler.adminMessage(
          `Welcome to the room!${
            socket.room.roomTopic !== ""
              ? ` The current topic is: "${socket.room.roomTopic}"`
              : " There is no topic for this room"
          } `
        ),
      });
      socket.to(socket.room.roomCode).emit("onUserJoin", {
        userCount: socket.room.userCount,
        admin: messageHandler.adminMessage("A new user has entered the room."),
      });
    } else {
      socket.emit("failedJoin", {
        message: "Could not find room to join.",
      });
    }
  });

  socket.on("leaveRoom", async () => {
    const wasLastUser = await roomHandler.leaveRoom(socket.room, socket.colour);

    // if still users in room, let them know a user has left
    if (!wasLastUser) {
      socket.to(socket.room.roomCode).emit("userLeft", {
        userCount: socket.room.userCount,
        admin: messageHandler.adminMessage("A user has left the room."),
      });
    }

    socket.emit("roomLeft");
    socket.room = undefined;
    socket.colour = undefined;
  });

  socket.on("typing", async (typing) => {
    let typingUsers = undefined;

    if (typing.isTyping) typingUsers = socket.room.typingStart();
    else typingUsers = socket.room.typingEnd();

    socket.emit("onTyping", { count: typingUsers });
    socket.to(socket.room.roomCode).emit("onTyping", { count: typingUsers });
  });

  socket.on("message", async (message) => {
    const createdMessage = messageHandler.userMessage(message, socket);

    socket.emit("newmessage", createdMessage);
    socket.to(socket.room.roomCode).emit("newmessage", createdMessage);
  });

  socket.on("disconnect", async () => {
    if (socket.room) {
      const wasLastUser = await roomHandler.leaveRoom(
        socket.room,
        socket.colour
      );

      if (!wasLastUser) {
        socket.to(socket.room.roomCode).emit("userLeft", {
          userCount: socket.room.userCount,
          admin: messageHandler.adminMessage("A user has left the room."),
        });
      }
    }
  });
});

app.enable("trust proxy");
// Add a handler to inspect the req.secure flag (see
// http://expressjs.com/api#req.secure). This allows us
// to know whether the request was via http or https.
app.use((req, res, next) => {
  req.secure
    ? // request was via https, so do no special handling
      res.redirect("http://" + req.headers.host + req.url)
    : // request was via http, so redirect to https
      next();
});

app.use(express.static(path.join(__dirname, "public")));
//app.use(cors());

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

// will pass 404 to error handler
app.use((req, res, next) => {
  const error = new Error("No such route found");
  error.status = 404;
  next(error);
});

// error handler middleware
app.use((error, req, res, next) => {
  res.status(error.status || 500).send({
    error: {
      status: error.status || 500,
      message: error.message || "Internal Server Error",
    },
  });
});

server.listen(port, () => console.log(`starting on port ${port}`));
