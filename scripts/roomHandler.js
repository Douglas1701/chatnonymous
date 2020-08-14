const colourDB = require("./colours");

class Room {
  constructor(code, topic) {
    this.code = code;
    this.topic = topic;
    this.users = 0;
    this.colours = colourDB.colours;
    this.typing = 0;
  }

  get roomCode() {
    return this.code;
  }

  get roomTopic() {
    return this.topic;
  }

  get userCount() {
    return this.users;
  }

  typingStart() {
    this.typing++;
    console.log(`Currently ${this.typing} people are typing`);
    return this.typing;
  }

  typingEnd() {
    this.typing--;

    if (this.typing <= 0) this.typing = 0;

    console.log(`Currently ${this.typing} people are typing`);

    return this.typing;
  }

  addUser() {
    this.users++;
    return this.generateColour();
  }

  removeUser(colour) {
    this.users--;
    this.colours.push(colour);
  }

  generateColour() {
    let idx = Math.floor(Math.random() * 100) + 1;
    const choosenColour = this.colours[idx];
    this.colours = this.colours.filter((col) => col != choosenColour);
    return choosenColour;
  }

  addColour(colour) {
    this.colours.push(colour);
  }
}

let rooms = [];

const createRoom = async (roomCode, roomTopic) => {
  rooms.push(new Room(roomCode, roomTopic));
};

const enterRoom = async (roomCode) => {
  let result = undefined;

  const foundRoom = await findRoom(roomCode);

  if (foundRoom) {
    let userColour = foundRoom.addUser();

    result = { room: foundRoom, colour: userColour };
  }

  return result;
};

const leaveRoom = async (room, colour) => {
  let lastUser = false;

  room.users--;

  if (room.userCount <= 0) {
    lastUser = true;
    rooms = rooms.filter((rm) => room.roomCode !== rm.roomCode);
  } else {
    room.addColour(colour);
  }

  return lastUser;
};

const findRoom = async (roomCode) => {
  return rooms.find((room) => room.roomCode === roomCode);
};

module.exports = {
  createRoom,
  enterRoom,
  leaveRoom,
};
