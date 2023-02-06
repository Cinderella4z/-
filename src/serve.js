const fs = require("fs");
const path = require("path");
// 将两个证书文件读取放到options对象中
// 使用readFileSync()方法，顺序地执行读文件和启动服务操作
const options = {
  cert: fs.readFileSync(path.join(__dirname, "ssl/cert.crt")),
  key: fs.readFileSync(path.join(__dirname, "ssl/cert.key")),
};

var app = require("express")();
var http = require("https").createServer(options, app);

var io = require("socket.io")(http, { cors: true });
io.on("connection", (socket) => {
  console.log(1);
  socket.on("offer", (offer, callback) => {
    socket.broadcast.emit("offer", offer);
  });
  socket.on("answer", async (answer) => {
    socket.broadcast.emit("answer", answer);
  });
  socket.on("ICE-candidate", (sdp) => {
    socket.broadcast.emit("ICE-candidate", sdp);
  });
});

http.listen(3000, (res) => {
  console.log("listening on *:3000");
});
