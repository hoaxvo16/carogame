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
initMatrix();
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
          currentUser = new user(data, 2);
          socket.matrix = initMatrix();
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
        socket.matrix = initMatrix();
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
      socket.matrix = initMatrix();
      socket.join(currentRoom.id);
      socket.room = currentRoom;
      console.log(currentRoom.id);
      io.to(socket.room.id).emit("user-join-room", currentRoom.id, currentRoom.userArr);
    }
    // in ra cac phong
  });
  socket.on("user-play", function (row, col) {
    socket.matrix[row][col] = socket.user.type;
    io.to(socket.room.id).emit("server-send-matrix-info", socket.user.type, row, col, socket.room.userArr.length);
    let positionLeft = getPosDiagonalLineLeft(row, col);
    let positionRight = getPosDiagonalLineRight(row, col);
    console.log(positionLeft);
    console.log(positionRight);
    if (
      checkDiagonalLineLeft(positionLeft[0], positionLeft[1], socket.user.type, socket.matrix) ||
      checkDiagonalLineRight(positionRight[0], positionRight[1], socket.user.type, socket.matrix) ||
      checkRowAndColumn(row, col, socket.user.type, socket.matrix)
    ) {
      socket.emit("you-win");
    } else socket.to(socket.room.id).emit("your-turn");
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
function initMatrix() {
  let matrix = [];
  for (let i = 0; i < 32; i++) {
    matrix[i] = new Array(10);
    for (let j = 0; j < 32; j++) {
      matrix[i][j] = 0;
    }
  }
  return matrix;
}
function getPosDiagonalLineRight(row, col) {
  let a = row;
  let b = col;
  while (b < 32 && a > 0) {
    if (b === 31) break;
    a--;
    b++;
  }
  let result = [a, b];
  return result;
}
function getPosDiagonalLineLeft(row, col) {
  let a = row;
  let b = col;
  while (b > 0 && a > 0) {
    a--;
    b--;
  }
  let result = [a, b];
  return result;
}
function checkDiagonalLineLeft(startRow, startCol, value, matrix) {
  let correct = 0;
  while (startRow < 32 && startCol < 32) {
    if (matrix[startRow][startCol] === value) {
      correct++;
    } else if (matrix[startRow][startCol] !== value && matrix[startRow][startCol] !== 0) {
      return false;
    }
    // console.log(correct);
    if (correct === 5) return true;
    startRow++;
    startCol++;
  }
  return false;
}
function checkDiagonalLineRight(startRow, startCol, value, matrix) {
  let correct = 0;
  while (startRow < 32 && startCol >= 0) {
    if (matrix[startRow][startCol] === value) {
      correct++;
    } else if (matrix[startRow][startCol] !== value && matrix[startRow][startCol] !== 0) {
      return false;
    }
    // console.log(correct);
    if (correct === 5) return true;
    startRow++;
    startCol--;
  }
  return false;
}
function checkRowAndColumn(row, col, value, matrix) {
  let correctRow = 0;
  let correctCol = 0;
  for (let i = 0; i <= col; i++) {
    if (matrix[row][i] === value) correctRow++;
    else if (matrix[i][row] !== value && matrix[i][col] !== 0) correctRow = 0;
    if (correctRow === 5) break;
  }
  for (let i = 0; i <= row; i++) {
    if (matrix[i][col] === value) correctCol++;
    else if (matrix[i][col] !== value && matrix[i][col] !== 0) correctCol = 0;
    if (correctCol === 5) break;
  }
  if (correctRow === 5 || correctCol === 5) return true;
  return false;
}
