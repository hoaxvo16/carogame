//kết nối tới server
var socket = io("http://localhost:3000");
//Xử lý những gì client gửi cho server
$(document).ready(function () {
  let width = $("#box-content").width();
  let height = $("#box-content").height();
  for (let i = 0; i < width / 20; i++) {
    for (let j = 0; j < height / 20; j++) {
      $("#box-content").append(
        "<rec class='box-inside' id=" +
          i.toString() +
          "+" +
          j.toString() +
          ">x</rec>"
      );
    }
  }
  $(".box-inside").click(function (event) {
    alert(event.target.id);
  });
});
//Xử lý những gì server gửi cho client
