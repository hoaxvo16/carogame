//kết nối tới server
var socket = io("https://carogame-hoavo.herokuapp.com");
// var socket = io("http://localhost:3000");
var playerTurn = true;
var roomID;
//Xử lý những gì client gửi cho server
$(document).ready(function () {
  $("#root").show();
  $("#wrapper").hide();
  $("#btn").click(function (data) {
    if (checkUserName($("#username").val()) === false) alert("Username Empty");
    else socket.emit("client-send-user-name", $("#username").val());
  });
  $("#exit").click(function () {
    $("#root").show();
    $("#wrapper").hide();
    socket.emit("player-exit", roomID);
  });
  sendMess();
  onTyping();
});
//Xử lý những gì server gửi cho client
socket.on("server-send-roomlist", function (data) {
  $("#room-list").html("");
  //sort danh sach room
  $("#room-list").show();
  data.sort((a, b) => a.id - b.id);
  data.forEach(element => {
    $("#room-list").append("<div class='gallery'><img src='closed-doors.svg'  width='600' height='400'><div class='desc'>ROOM" + element.id + "</div></div>");
  });
});
socket.on("username-taken", function () {
  alert("username taken!!!");
});
socket.on("user-join-room", function (roomName, userArr) {
  $("#root").hide();
  $("#wrapper").show();
  $("#current-room").html("ROOM " + roomName);
  $("#user-login").html("");
  setSymbol(userArr);
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
  setSymbol(data);
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
    $("#log-event").html("");
    playerTurn = true;
  }
});
socket.on("your-turn", function () {
  $("#log-event").html("Your Turn");
  playerTurn = true;
});
socket.on("has-checked", function () {
  playerTurn = true;
});
socket.on("you-win", function (userArr) {
  alert("You Win");
  $("#user-login").html("");
  $("#box-content").html("");
  $("#log-event").html("");
  setSymbol(userArr);
  initPlayYard();
  socket.emit("player-accept", roomID);
});
socket.on("you-lose", function (userArr) {
  console.log("lose");
  alert("You Lose");
  $("#user-login").html("");
  $("#box-content").html("");
  $("#log-event").html("");
  setSymbol(userArr);
  initPlayYard();
  socket.emit("player-accept", roomID);
});
socket.on("other-player-has-accepted", function () {
  playerTurn = true;
  clickOnBox();
});
socket.on("server-send-mess", function (name, mess) {
  $("#chat-box").append("<div><i style='font-size:14px' class='fa'>&#xf105;</i><b>" + name + "</b>: " + mess + "</div>");
  var height = 0;
  $("#chat-box div").each(function (i, value) {
    height += parseInt($(this).height());
  });
  height += "";
  $("#chat-box").animate({ scrollTop: height });
});
socket.on("other-player-typing", function (data) {
  $("#nofication").html(data);
});
socket.on("other-player-not-typing", function () {
  $("#nofication").html("");
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
function setSymbol(userArr) {
  console.log(userArr);
  userArr.forEach(element => {
    if (element.type === 1) $("#user-login").append("<div class='player'><p id='x'>X:</p>" + element.name + "</div>");
    else {
      $("#user-login").append("<div class='player'><p id='o'>O:</p>" + element.name + "</div>");
    }
  });
}
function clickOnBox() {
  $(".box-inside").click(function (event) {
    let index = event.target.id.split("+");
    if (playerTurn) {
      let row = parseInt(index[0]);
      let col = parseInt(index[1]);
      socket.emit("user-play", row, col, roomID);
      $("#log-event").html("Opponent Turn");
      playerTurn = false;
    }
  });
}
function sendMess() {
  $("#send-mess").click(function () {
    socket.emit("user-send-mess", $("#mess").val());
    $("#mess").val("");
  });

  $("#mess").bind("enterKey", function (e) {
    socket.emit("user-send-mess", $("#mess").val());
    $("#mess").val("");
  });
  $("#mess").keyup(function (e) {
    if (e.keyCode == 13) {
      $(this).trigger("enterKey");
    }
  });
}
function onTyping() {
  $("#mess").focusin(function () {
    socket.emit("user-is-typing");
  });
  $("#mess").focusout(function () {
    socket.emit("user-not-typing");
  });
}
function checkUserName(val) {
  if (val === "") return false;
  for (let i = 0; i < val.length; i++) {
    if (val.charCodeAt(i) !== 32) return true;
  }
  return false;
}

let windowHeight = $(window).height();
let windowWidth = $(window).width();
let statusBarHeight = windowHeight - document.getElementById("box-content").width;
document.getElementById("status-bar").style.height = statusBarHeight + "px";
document.getElementById("log-event").style.width = (windowWidth - 630) / 4 + "px";
document.getElementById("chat-wrap").style.marginLeft = (windowWidth - 630) / 4 + 632 + "px";
document.getElementById("chat-wrap").style.width = (windowWidth - 630) / 2 + "px";
document.getElementById("chat-wrap").style.width = (windowWidth - 630) / 2 + "px";
document.getElementById("user-login").style.width = (windowWidth - 630) / 4 - 2 + "px";
document.getElementById("user-login").style.marginLeft = (3 * (windowWidth - 630)) / 4 + 633 + "px";
