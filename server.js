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
var roomList = [];
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
    this.matrix = [];
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
  initMatrix() {
    for (let i = 0; i < 32; i++) {
      this.matrix[i] = [];
      for (let j = 0; j < 32; j++) {
        this.matrix[i][j] = 0;
      }
    }
  }
}
console.log("server is running");
//Có người kết nối
io.on("connection", function (socket) {
  console.log("Connected with: " + socket.id);
  //gui roomlist cho tat ca user
  io.sockets.emit("server-send-roomlist", roomList);
  //user join room
  socket.on("client-send-user-name", function (data) {
    let check = false;
    console.log("user " + socket.id + " send: " + data);
    //neu da co room
    if (roomList.length) {
      roomList.forEach(element => {
        //room chua du 2 nguoi
        if (element.numOfUser < 2) {
          if (element.userArr[0].type === 1) currentUser = new user(data, 2);
          else currentUser = new user(data, 1);
          socket.user = currentUser;
          socket.room = element;
          //join chung phong
          socket.join(element.id);
          element.addUser(currentUser);
          element.increaseNumOfUser();
          //gui cho user cung room va user moi vao co user moi vao phong
          io.to(socket.room.id).emit("user-join-room", element.id, element.userArr);
          check = true;
        }
      });
      //tat ca cac phong deu full nguoi
      if (!check) {
        //lay id room kha dung
        let id = getRoom(roomList);
        console.log("new id= " + id);
        currentUser = new user(data, 1);
        socket.user = currentUser;
        currentRoom = new room(id, 1);
        currentRoom.addUser(currentUser);
        roomList.push(currentRoom);
        roomList[roomList.indexOf(currentRoom)].initMatrix();
        socket.room = currentRoom;
        socket.join(currentRoom.id);
        io.to(socket.room.id).emit("user-join-room", currentRoom.id, currentRoom.userArr);
      }
    } else {
      currentUser = new user(data, 1);
      socket.user = currentUser;
      currentRoom = new room(1, 1);
      currentRoom.addUser(currentUser);
      roomList.push(currentRoom);
      roomList[roomList.indexOf(currentRoom)].initMatrix();
      socket.join(currentRoom.id);
      socket.room = currentRoom;
      console.log(currentRoom.id);
      io.to(socket.room.id).emit("user-join-room", currentRoom.id, currentRoom.userArr);
    }
    // in ra cac phong
  });
  socket.on("user-play", function (row, col, id) {
    let index = getIndexOfRoom(id);
    if (roomList[index].matrix[row][col] === 0 && roomList[index].numOfUser > 1) {
      console.log("checked");
      if (socket.user.type === 1) {
        roomList[index].matrix[row][col] = "x";
      } else {
        roomList[index].matrix[row][col] = "o";
      }
      io.to(socket.room.id).emit("server-send-matrix-info", socket.user.type, row, col, socket.room.userArr.length);
      if (checkWin(row, col, roomList[index].matrix)) {
        console.log("win detected" + row + col);
        socket.emit("you-win");
        socket.to(socket.room.id).emit("you-lose");
      } else socket.to(socket.room.id).emit("your-turn");
    } else {
      socket.emit("has-checked");
    }
  });
  socket.on("player-accept", function (id) {
    let index = getIndexOfRoom(id);
    console.log(index);
    if (socket.user.type === 1) socket.user.type = 2;
    else socket.user.type = 1;
    roomList[index].initMatrix();
    socket.to(socket.room.id).emit("other-player-has-accepted");
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
        roomList.splice(roomList.indexOf(socket.room), 1);
        console.log(roomList);
      }
    } catch (error) {}
  });
});
//Render file ejs
app.get("/", function (req, res) {
  res.render("index");
});
//lay id room kha dung
function getRoom(roomList) {
  let max = 1;
  for (let i = 0; i < roomList.length; i++) {
    if (roomList[i].id > max) max = roomList[i].id;
  }
  for (let i = 1; i < max; i++) {
    for (let j = 0; j < roomList.length; j++) {
      if (roomList[j].id != i) return i;
    }
  }
  return max + 1;
}
function getIndexOfRoom(id) {
  for (let i = 0; i < roomList.length; i++) {
    if (roomList[i].id === id) {
      return i;
    }
  }
}
function checkWin(row, col, grid) {
  return (
    checkLine(row - 4, col - 4, 1, 1, grid[row][col], grid) ||
    checkLine(row - 4, col, 1, 0, grid[row][col], grid) ||
    checkLine(row, col - 4, 0, 1, grid[row][col], grid) ||
    checkLine(row + 4, col - 4, -1, 1, grid[row][col], grid)
  );
}
function checkLine(base_row, base_col, inc_row, inc_col, sym, grid) {
  let sym2;
  if (sym === "x") sym2 = "o";
  else sym2 = "x";
  let count = 0;
  for (let i = 0; i <= 8; i++) {
    if (checkIndex(base_row, base_col) && grid[base_row][base_col] === sym) {
      count++;
    } else {
      count = 0;
    }
    if (
      count === 5 &&
      (!checkIndex(base_row + 1, base_col + 1) ||
        grid[base_row + inc_row][base_col + inc_col] != sym2 ||
        !checkIndex(base_row - 5 * inc_row, base_col - 5 * inc_col) ||
        grid[base_row - 5 * inc_row][base_col - 5 * inc_col] != sym2)
    )
      return true;
    base_row += inc_row;
    base_col += inc_col;
  }
  return false;
}

function checkIndex(row, col) {
  return row >= 0 && col >= 0 && row <= 31 && col <= 31;
}
