//kết nối tới server
var socket = io("https://carogame-hoavo.herokuapp.com");
// var socket = io("http://localhost:3000");
var playerTurn = true;
var roomID;
//Xử lý những gì client gửi cho server
$(document).ready(function () {
  $("#login-form").show();
  $("#room-list").show();
  $("#status-bar").hide();
  $("#box-content").hide();
  $("#current-room").hide();
  $("#chat-wrap").hide();
  $("#log-event").hide();
  $("#user-login").hide();
  $("#btn").click(function (data) {
    socket.emit("client-send-user-name", $("#username").val());
  });
});
//Xử lý những gì server gửi cho client
socket.on("server-send-roomlist", function (data) {
  $("#room-list").html("");
  //sort danh sach room
  data.sort((a, b) => a.id - b.id);
  data.forEach(element => {
    $("#room-list").append("<div class='gallery'><img src='closed-doors.svg'  width='600' height='400'><div class='desc'>ROOM" + element.id + "</div></div>");
  });
});

socket.on("user-join-room", function (roomName, userArr) {
  $("#login-form").hide();
  $("#current-room").show();
  $("#status-bar").show();
  $("#chat-wrap").show();
  $("#log-event").show();
  $("#user-login").show();
  $("#current-room").html("ROOM " + roomName);
  $("#user-login").html("");
  userArr.forEach(element => {
    $("#user-login").append("<div class='player'>" + element.name + "</div>");
  });
  $("#box-content").show();
  $("#room-list").hide();
  initPlayYard();
  roomID = roomName;
  clickOnBox();
});

socket.on("user-leave-room", function (data) {
  $("#user-login").html("");
  $("#box-content").html("");
  initPlayYard();
  data.forEach(element => {
    $("#user-login").append("<div class='player'>" + element.name + "</div>");
  });
});
socket.on("server-send-matrix-info", function (userType, row, col, numOfUserInRoom) {
  console.log(numOfUserInRoom);
  let idBox = row + "+" + col;
  console.log(userType);
  if (userType === 1 && numOfUserInRoom > 1) {
    console.log(idBox);
    document.getElementById(idBox).innerHTML = "X";
    document.getElementById(idBox).style.color = "blue";
  } else if (userType === 2 && numOfUserInRoom > 1) {
    document.getElementById(idBox).innerHTML = "O";
    document.getElementById(idBox).style.color = "red";
  } else {
    playerTurn = true;
  }
});
socket.on("your-turn", function () {
  playerTurn = true;
});
socket.on("has-checked", function () {
  playerTurn = true;
});
socket.on("you-win", function () {
  alert("You Win");
  $("#box-content").html("");
  initPlayYard();
  socket.emit("player-accept", roomID);
});
socket.on("you-lose", function () {
  console.log("lose");
  alert("You Lose");
  $("#box-content").html("");
  initPlayYard();
  socket.emit("player-accept", roomID);
});
socket.on("other-player-has-accepted", function () {
  console.log("success");
  playerTurn = true;
  clickOnBox();
});
function initPlayYard() {
  let width = $("#box-content").width();
  let height = $("#box-content").height();
  for (let i = 0; i < width / 20; i++) {
    for (let j = 0; j < height / 20; j++) {
      $("#box-content").append("<rect class='box-inside' id=" + i.toString() + "+" + j.toString() + "></rect>");
    }
  }
}
function clickOnBox() {
  $(".box-inside").click(function (event) {
    let index = event.target.id.split("+");
    console.log("clicked");
    if (playerTurn) {
      console.log(event.target.id);
      let row = parseInt(index[0]);
      let col = parseInt(index[1]);
      console.log(row + " " + col);
      socket.emit("user-play", row, col, roomID);
      playerTurn = false;
    }
  });
}
let windowHeight = $(window).height();
let windowWidth = $(window).width();
console.log(windowHeight + " " + windowWidth);
let statusBarHeight = windowHeight - document.getElementById("box-content").width;
document.getElementById("status-bar").style.height = statusBarHeight + "px";
document.getElementById("log-event").style.width = (windowWidth - 630) / 4 + "px";
console.log((windowWidth - 630) / 4);
document.getElementById("chat-wrap").style.marginLeft = (windowWidth - 630) / 4 + 632 + "px";
document.getElementById("chat-wrap").style.width = (windowWidth - 630) / 2 + "px";
document.getElementById("chat-wrap").style.width = (windowWidth - 630) / 2 + "px";
document.getElementById("user-login").style.width = (windowWidth - 630) / 4 - 2 + "px";
document.getElementById("user-login").style.marginLeft = (3 * (windowWidth - 630)) / 4 + 633 + "px";
