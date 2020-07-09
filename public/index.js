//kết nối tới server
var socket = io("http://localhost:3000");
//Xử lý những gì client gửi cho server
$(document).ready(function () {
  $("#login-form").show();
  $("#room-list").show();
  $("#box-content").hide();
  $("#current-room").hide();
  // let width = $("#box-content").width();
  // let height = $("#box-content").height();
  // for (let i = 0; i < width / 20; i++) {
  //   for (let j = 0; j < height / 20; j++) {
  //     $("#box-content").append(
  //       "<rect class='box-inside' id=" +
  //         i.toString() +
  //         "+" +
  //         j.toString() +
  //         "></rect>"
  //     );
  //   }
  // $(".box-inside").click(function (event) {;
  //   $(this).css("color", "blue");
  //   $(this).html("X");
  // });
  $("#btn").click(function (data) {
    socket.emit("client-send-user-name", $("#username").val());
  });
});
//Xử lý những gì server gửi cho client
socket.on("server-send-roomlist", function (data) {
  $("#room-list").html("");
  data.forEach(element => {
    console.log(element.name);
    $("#room-list").append("<div class='room'>" + element.name + "</div>");
  });
});

socket.on("user-join-room", function (roomName, userArr) {
  $("#login-form").hide();
  $("#current-room").show();
  $("#current-room").html(roomName);
  $("#user-login").html("");
  userArr.forEach(element => {
    $("#user-login").append("<div>" + element.name + "</div>");
  });
  $("#box-content").show();
  $("#room-list").hide();
  let width = $("#box-content").width();
  let height = $("#box-content").height();
  for (let i = 0; i < width / 20; i++) {
    for (let j = 0; j < height / 20; j++) {
      $("#box-content").append(
        "<rect class='box-inside' id=" +
          i.toString() +
          "+" +
          j.toString() +
          "></rect>"
      );
    }
  }
  $(".box-inside").click(function (event) {
    $(this).css("color", "blue");
    $(this).html("X");
  });
});
