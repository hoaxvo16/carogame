var socket = io("http://localhost:3000");
$(document).ready(function () {
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      $("#box-content").append("<rec class='box-inside'>x</rec>");
    }
  }
});
