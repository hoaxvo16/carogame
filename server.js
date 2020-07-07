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

console.log("server is running");
//Có người kết nối
io.on("connection", function (socket) {
  console.log("Connected with: " + socket.id);
});
//Render file ejs
app.get("/", function (req, res) {
  res.render("index");
});
