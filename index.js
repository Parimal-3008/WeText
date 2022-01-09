const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const port = 3000;
const app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "static")));
app.use(cookieParser());
http.listen(3000, function () {
  console.log("server started on 3000");
});
const fileP = path.join(__dirname + "/public");
const schema = new mongoose.Schema({
  username: String,
  password: String,
  SrNo: Number,
});
const schema2 = new mongoose.Schema([
  {
    roomid: String,
    messages: [{ sender: String, msg: String }],
  },
]);
const User = mongoose.model("users", schema);
const Msg = mongoose.model("msgs", schema2);
mongoose.connect("mongodb://localhost/WeText", {
  useNewUrlParser: true,
});
const MongoClient = require("mongodb");
const { AsyncLocalStorage } = require("async_hooks");
const { resolve } = require("path");
const { rejects } = require("assert");
const { isInt32Array } = require("util/types");
const url = "mongodb://localhost:27017/";
const databasename = "WeText"; // Database name

app.get("/", async function (req, res) {
  console.log(req.cookies);

  if (req.cookies.username != null) {
    console.log("a");
    await showall(res, req.cookies.username);
  } else res.redirect("/login");
  //res.render("home");
});
app.get("/login", function (req, res) {
  if (req.cookies.username != null) {
    res.redirect("/");
  } else res.render("login");
});
app.get("/register", function (req, res) {
  if (req.cookies.username != null) {
    res.redirect("/");
  } else res.render("register", { msg: "" });
});
app.post("/login", function (req, res) {
  console.log(req.body);
  let u = req.body.username;
  let p = req.body.password;
  User.findOne({ username: u }, async function (err, founduser) {
    if (err) console.log(err);
    else {
      if (founduser.password == p) {
        res.cookie("username", u, {
          secure: true,
          httpOnly: true,
          sameSite: "lax",
        });
        console.log("a");
        await showall(res, u);
        //   console.log(arr2);
        // res.render("home",{user: u,arr: arr2} );
      } else {
        res.render("login", { msg: "wrong username or password" });
      }
    }
  });
  //authenticate it
});
app.post("/register", function (req, res) {
  let u = req.body.username;
  let p1 = req.body.password;
  let p2 = req.body.password2;
  if (p1 != p2) res.render("register", { msg: "Passwords doesn't match" });
  else {
    User.findOne({ username: u }, function (err, founduser) {
      if (err) console.log(err);
      else {
        if (founduser)
          res.render("register", { msg: "Choose different username" });
        else {
          User.find({}, function (err, arr) {
            const user = new User({
              username: u,
              password: p1,
              SrNo: arr.length + 1,
            });
            user.save();
            res.cookie("username", u, {
              secure: true,
              httpOnly: true,
              sameSite: "lax",
            });
            res.redirect("/");
          });
        }
      }
    });
  }
});
async function showall(res, user2) {
  User.find({}, async function (err, arr) {
    // console.log(arr);

    res.render("home", { user: user2, arr: arr });
  });
}
m1= [{sender:"parimal", msg:"Hi there"},{sender:"parimal", msg:"I am fine"},{sender:"Killua Zolydeck", msg:"Easydsfghjkljhgfdsafghjkljhgfdsadfghjkl;kjhgfdssssffffffff    ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffPizzy"},{sender:"Killua Zolydeck", msg:"Hos life going?"},{sender:"parimal", msg:"Great"}];
app.get("/chat", async function (req, res) {
  if (req.cookies.username == req.query.sender) {
    let s1 = await init(req.query.sender);
    let s2 = await init(req.query.reciever);
    let roomid = String;
    if (s1 < s2) roomid = s1 + "@" + s2;
    else roomid = s2 + "@" + s1;
   
    Msg.findOne({roomid:roomid},function(err,arr)
    {
    //  for(let i in arr)
    //  console.log(arr[i].messages)
      console.log(arr.messages );
      res.render("chat", {
        sender: req.query.sender,
        reciever: req.query.reciever,
        messages:  arr.messages,
  
      });
 
    });
    
    
  } else {
    res.redirect("/login");
  }

}); 
async function init(user) {
  try {
    const name = await dbq(user);
    // console.log(name.SrNo);
    return name.SrNo;
  } catch (error) {
    console.log(error);
  }
}

async function dbq(user) {
  const db = await require("mongodb").MongoClient.connect(
    "mongodb://localhost:27017/"
  );
  const dbo = db.db("WeText");
  const user2 = await dbo.collection("users").findOne({ username: user });
  db.close();
  return user2;
}
io.on("connection", function (socket) {
  console.log("A user connected");

  socket.on("join-room", async (data) => {
    let s1 = await init(data.s);
    let s2 = await init(data.r);
    let roomid = String;
    if (s1 < s2) roomid = s1 + "@" + s2;
    else roomid = s2 + "@" + s1;
    socket.join(roomid);
  });
  socket.on("leave-room", async function (data) {
    let s1 = await init(data.s);
    let s2 = await init(data.r);
    let roomid = String;
    if (s1 < s2) roomid = s1 + "@" + s2;
    else roomid = s2 + "@" + s1;
    socket.leave(roomid);
    console.log("left");
  });
  socket.on("msg", async function (data) {
    console.log(data);
    let s1 = await init(data.s);
    let s2 = await init(data.r);
    let roomid = String;
    if (s1 < s2) roomid = s1 + "@" + s2;
    else roomid = s2 + "@" + s1;
    let msg = { sender: data.s, msg: data.message };
    Msg.findOne({ roomid: roomid }, function (err, founduser) {
      if (err) {
        console.log(err);
      } else {
        if (founduser) {
          let arr = founduser.messages;
          Msg.findOneAndUpdate(
            { roomid: roomid },
            { $push: { messages: msg } },
            { safe: true, upsert: true },
            function (err, doc) {
              if (err) {
                console.log(err);
              } else {
              }
            }
          );
        } else {
          Msg.find({}, function (err, arr) {
            const p = new Msg({ roomid: roomid, messages: [msg] });
            p.save();
          });
        }
      }
    });
    io.sockets.in(roomid).emit("newmsg", data);
  });
});
// User.find({}, function (err, arr) {
//   const user = new User({
//     username: u,
//     password: p1,
//     SrNo: arr.length + 1,
//   });
//   user.save();
//   res.cookie("username", u, {
//     secure: true,
//     httpOnly: true,
//     sameSite: "lax",
//   });
//   res.redirect("/");
// });
//   io.on('connection', function(socket){
//     console.log('A user connected');
//     //socket.join(roomid);
//     socket.on("join-room",data=>{
//       let s1=await init(data.s);
//       let s2=await init(data.r);
//       let roomid = String;
//        if(s1<s2)
//         roomid= s1+"@"+s2;
//         else
//         roomid =  s2+"@"+ s1;
//             console.log(roomid);

//     });
//     socket.on('msg', function(data){

//        console.log(data);
//        io.emit('newmsg', data);
//     })
//  });
