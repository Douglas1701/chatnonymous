require("dotenv").config();
const express = require("express");
const socketIO = require("socket.io");
const app = express();
const http = require("http");
const port = process.env.PORT || 5000;
const cors = require("cors");

let server = http.createServer(app);
let io = socketIO(server);

app.enable("trust proxy");
// Add a handler to inspect the req.secure flag (see
// http://expressjs.com/api#req.secure). This allows us
// to know whether the request was via http or https.
app.use((req, res, next) => {
  req.secure
    ? // request was via https, so do no special handling
      next()
    : // request was via http, so redirect to https
      res.redirect("https://" + req.headers.host + req.url);
});

//app.use(express.static("public"));
app.use(cors());

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
