//require thư viện
var express = require("express");
var app = express();
//set use: những file gửi cho client, view engine: loại file hiển thị, thư mục chứa file view
app.use(express.static("./public"));
app.set("view engine", "ejs");
app.set("views", "./views");
//require http va socket io
var server = require("http").Server(app);
var io = require("socket.io")(server);

server.listen(process.env.PORT || 3000);
class user {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
}
var rooms = [];
class room {
  constructor(name, numuser) {
    this.name = name;
    this.numOfUser = numuser;
    this.userArr = [];
  }
  increaseNumOfUser() {
    this.numOfUser++;
  }
  addUser(user) {
    this.userArr.push(user);
  }
  subUser() {
    this.numOfUser--;
  }
  getNumOfUser() {
    return this.numOfUser;
  }
}
console.log("server is running");
//Có người kết nối
io.on("connection", function (socket) {
  console.log("Connected with: " + socket.id);

  io.sockets.emit("server-send-roomlist", rooms);
  socket.on("client-send-user-name", function (data) {
    let index = 1;
    let check = false;
    console.log("user " + socket.id + " send: " + data);
    if (rooms.length) {
      rooms.forEach(element => {
        index++;
        if (element.numOfUser < 2) {
          currentUser = new user(data, 2);
          socket.user = currentUser;
          socket.room = element;
          socket.join(socket.room);
          element.addUser(currentUser);
          element.increaseNumOfUser();
          io.to(socket.room).emit("user-join-room", element.name, currentUser);
          check = true;
        }
      });
      if (!check) {
        currentUser = new user(data, 1);
        socket.user = currentUser;
        currentRoom = new room("room " + index.toString(), 1);
        currentRoom.addUser(currentUser);
        rooms.push(currentRoom);
        socket.room = currentRoom;
        socket.join(socket.room);
        io.to(socket.room).emit(
          "user-join-room",
          currentRoom.name,
          currentUser
        );
      }
    } else {
      currentUser = new user(data, 1);
      socket.user = currentUser;
      currentRoom = new room("room 1", 1);
      currentRoom.addUser(currentUser);
      rooms.push(currentRoom);
      socket.room = currentRoom;
      socket.join(socket.room);
      io.to(socket.room).emit("user-join-room", currentRoom.name, currentUser);
    }
  });
  socket.on("disconnect", function () {
    console.log(socket.id + " disconnected");
    if (rooms.length) {
      try {
        socket.room.subUser();
      } catch (error) {}
    }
    if (socket.room.getNumOfUser() === 0) {
      rooms.splice(rooms.indexOf(socket.room), 1);
    }
  });
});
//Render file ejs
app.get("/", function (req, res) {
  res.render("index");
});
