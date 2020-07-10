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
var rooms = [];
server.listen(process.env.PORT || 3000);
class user {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
}
class room {
  constructor(id, numuser) {
    this.id = id;
    this.numOfUser = numuser;
    this.userArr = [];
  }
  increaseNumOfUser() {
    this.numOfUser++;
  }
  addUser(user) {
    this.userArr.push(user);
  }
  delUser(user) {
    this.userArr.splice(this.userArr.indexOf(user), 1);
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
  //gui roomlist cho tat ca user
  io.sockets.emit("server-send-roomlist", rooms);
  //user join room
  socket.on("client-send-user-name", function (data) {
    let check = false;
    console.log("user " + socket.id + " send: " + data);
    //neu da co room
    if (rooms.length) {
      rooms.forEach(element => {
        //room chua du 2 nguoi
        if (element.numOfUser < 2) {
          currentUser = new user(data, 2);
          socket.user = currentUser;
          socket.room = element;
          //join chung phong
          socket.join(element.id);
          element.addUser(currentUser);
          element.increaseNumOfUser();
          //gui cho user cung room va user moi vao co user moi vao phong
          io.to(socket.room.id).emit(
            "user-join-room",
            element.id,
            element.userArr
          );
          check = true;
        }
      });
      //tat ca cac phong deu full nguoi
      if (!check) {
        //lay id room kha dung
        let id = getRoom(rooms);
        console.log("new id= " + id);
        currentUser = new user(data, 1);
        socket.user = currentUser;
        currentRoom = new room(id, 1);
        currentRoom.addUser(currentUser);
        rooms.push(currentRoom);
        socket.room = currentRoom;
        socket.join(currentRoom.id);
        io.to(socket.room.id).emit(
          "user-join-room",
          currentRoom.id,
          currentRoom.userArr
        );
      }
    } else {
      currentUser = new user(data, 1);
      socket.user = currentUser;
      currentRoom = new room(1, 1);
      currentRoom.addUser(currentUser);
      rooms.push(currentRoom);
      socket.join(currentRoom.id);
      socket.room = currentRoom;
      console.log(currentRoom.id);
      io.to(socket.room.id).emit(
        "user-join-room",
        currentRoom.id,
        currentRoom.userArr
      );
    }
    // in ra cac phong
    console.log(socket.adapter.rooms);
  });
  socket.on("user-play", function (row, col) {
    io.to(socket.room.id).emit(
      "server-send-matrix-info",
      socket.user.type,
      row,
      col,
      socket.room.userArr.length
    );
    socket.to(socket.room.id).emit("your-turn");
  });
  //co nguoi ngat ket noi
  socket.on("disconnect", function () {
    console.log(socket.id + " disconnected");
    //xoa user
    try {
      socket.room.delUser(socket.user);
      console.log(socket.room.userArr);
      //gui cho user con lai co nguoi roi phong
      io.to(socket.room.id).emit("user-leave-room", socket.room.userArr);
      if (socket.room.getNumOfUser() === 0) {
        rooms.splice(rooms.indexOf(socket.room), 1);
        console.log(rooms);
      }
    } catch (error) {}
  });
});
//Render file ejs
app.get("/", function (req, res) {
  res.render("index");
});
//lay id room kha dung
function getRoom(rooms) {
  let max = 1;
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].id > max) max = rooms[i].id;
  }
  for (let i = 1; i < max; i++) {
    for (let j = 0; j < rooms.length; j++) {
      if (rooms[j].id != i) return i;
    }
  }
  return max + 1;
}
