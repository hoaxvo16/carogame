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
  delUser() {
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
      let max = Math.max.apply(Math, rooms.name);
      rooms.forEach(element => {
        index++;
        if (element.numOfUser < 2) {
          currentUser = new user(data, 2);
          socket.user = currentUser;
          socket.room = element;
          socket.join(element.name);
          element.addUser(currentUser);
          element.increaseNumOfUser();
          io.to(socket.room.name).emit(
            "user-join-room",
            element.name,
            element.userArr
          );
          check = true;
        }
      });
      if (!check) {
        currentUser = new user(data, 1);
        socket.user = currentUser;
        currentRoom = new room(index, 1);
        currentRoom.addUser(currentUser);
        rooms.push(currentRoom);
        socket.room = currentRoom;
        socket.join(currentRoom.name);
        io.to(socket.room.name).emit(
          "user-join-room",
          currentRoom.name,
          currentRoom.userArr
        );
      }
    } else {
      currentUser = new user(data, 1);
      socket.user = currentUser;
      currentRoom = new room(1, 1);
      currentRoom.addUser(currentUser);
      rooms.push(currentRoom);
      socket.join(currentRoom.name);
      socket.room = currentRoom;
      io.to(socket.room.name).emit(
        "user-join-room",
        currentRoom.name,
        currentRoom.userArr
      );
    }
    console.log(socket.adapter.rooms);
  });

  socket.on("disconnect", function () {
    console.log(socket.id + " disconnected");
    try {
      socket.room.delUser();
      if (socket.room.getNumOfUser() === 0) {
        rooms.splice(rooms.indexOf(socket.room), 1);
      }
    } catch (error) {}
  });
});
//Render file ejs
app.get("/", function (req, res) {
  res.render("index");
});
