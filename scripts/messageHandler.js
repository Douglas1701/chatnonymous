const moment = require("moment");

const userMessage = (message, socket) => {
  return {
    time: moment().format("h:mm:ss a"),
    userId: socket.userId,
    text: message.text,
    colour: socket.colour,
  };
};

const adminMessage = (message) => {
  return {
    time: moment().format("h:mm:ss a"),
    text: message,
    colour: "rgba(68, 68, 68, 1)",
    admin: true,
  };
};

module.exports = {
  userMessage,
  adminMessage,
};
