const ejs = require("ejs");
const path = require("path");
const express = require("express");
const db = require("./database/data.js");
const { ObjectId } = require("mongodb");
const session = require("express-session");
const websocket = require("ws");
const MongoDBStore = require("connect-mongodb-session")(session);

// async function test() {
//   try {
//     const htmlData = await ejs.renderFile(
//       path.join(__dirname, "views/includes/item.ejs"),
//       { name: "Tuchar" },
//       { async: true, views: "views" }
//       // function (err, str) {
//       //   console.log(err || str);
//       // }
//     );
//     console.log("----------------------")
//     console.log(htmlData);
//     console.log("----------------------")
//   } catch (err) {
//     console.log(err);
//   }
// }

// test();

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let sessionStorage = new MongoDBStore({
  uri: "mongodb://127.0.0.1:27017",
  databaseName: "chat-application",
});
app.use(
  session({
    secret: "Have fun Developing",
    saveUninitialized: false,
    resave: false,
    store: sessionStorage,
  })
);

const wss = new websocket.WebSocketServer({ port: 3080 });

wss.on("connection", function (ws) {
  wss.on("error", console.error);

  ws.on("message", async function (data) {
    // Do Something when message is recived
    // Make it so that the user id and group id
    // linked to this socket, st we can send new
    // messages to the client through this sokcet
    // specific for that client and group
    try {
      let connectionDetails = await JSON.parse(data);

      ws.data = {
        userId: new ObjectId(connectionDetails.userId),
        groupId: new ObjectId(connectionDetails.groupId),
      };
      // console.log(ws.data);

      // console.log(ws.data);
    } catch {
      console.log("Failed parsing Data send for Initialization");
      ws.close();
    }
  });

  // I need to make sure that, we can send code from outside this block
  // ws.send("");
});

app.get("/", function (req, res) {
  res.redirect("/login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", async function (req, res) {
  let registrationData = req.body;
  let username = registrationData.username;
  let password = registrationData.password;
  let confirmPassword = registrationData["confirm-password"];

  console.log(registrationData);

  // Check if username already exists in database, if yes send error
  try {
    const result = await db
      .getDb()
      .collection("users")
      .findOne({ username: username });
    if (result) {
      console.log("post/register : User name exists");
      const result = { error: 1, "error-text": "Username already exists" };
      res.status(406).json(result);
      return;
    }
    console.log("post/register : User name doesn't exist");
    // return;
  } catch (err) {
    console.log(
      "post/register : ERROR : Failed searching database for username"
    );
    console.log(err);
    return;
  }

  // Check if passwords are equal, if no send error
  if (password != confirmPassword) {
    const result = {
      error: 1,
      "error-text": "Passwords are not same!",
    };
    res.status(406).json(result);
    return;
  }

  // save user details in database and send success message
  try {
    const result = db.getDb().collection("users").insertOne({
      username: username,
      password: password,
      joined_on: new Date(),
    });

    res.json();
  } catch (err) {
    console.log(
      "post/register : ERROR : Failed saving user details to database!"
    );
    console.log(err);
  }
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", async function (req, res) {
  // Get user Entered Data
  let loginData = req.body;
  let username = loginData.username;
  let password = loginData.password;

  let storedUserData;
  try {
    storedUserData = await db
      .getDb()
      .collection("users")
      .findOne({ username: username });

    // Check if user name is registered; if not present return error
    if (!storedUserData) {
      const result = {
        error: 1,
        "error-text": "Invalid Credintials",
      };
      return res.status(406).json(result);
    }

    // Check for password validity; if invalid return error
    let storedPassword = storedUserData.password;
    // console.log(storedPassword)
    // console.log(password)
    if (storedPassword != password) {
      const result = {
        error: 1,
        "error-text": "Invalid Credintials",
      };
      return res.status(406).json(result);
    }
  } catch (err) {
    console.log("post/login : ERROR : Failed getting data from database");
    console.log(err);
  }

  // Generate session cookie and save session to database
  req.session.isAuthenticated = true;
  req.session.userName = storedUserData.username;
  req.session.userId = storedUserData._id;

  // Send successfull message
  res.json();
});

app.use(function checkAuthentication(req, res, next) {
  if (!req.session.isAuthenticated) {
    console.log(req.method + req.path + " : Unauthorized Access!!");
    // console.log(req)
    return res.send("You Attacker! Go make your own chat app and hack it!");
    // return res.redirect("/login");
  }
  next();
});

app.get("/logout", function (req, res) {
  req.session.isAuthenticated = false;
  delete req.session.username;
  delete req.session.userId;

  res.redirect("/login");
});

app.get("/home", async function (req, res) {
  let groups;

  try {
    groups = await db.getDb().collection("groups").find().toArray();
  } catch (err) {
    console.log("get/home : ERROR : Database Fetch Error");
    console.log(err);
  }

  res.render("home", { groups: groups, username: req.session.username });
});

app.get("/chatroom/:id", async function (req, res) {
  let groupId = req.params.id;
  let chats;

  try {
    chats = await db
      .getDb()
      .collection("chats")
      .find({ groupId: new ObjectId(groupId) })
      .toArray();
  } catch (err) {
    console.log("get/chatroom/:id : ERROR : Database fetch Error");
    console.log(err);
  }

  let groupName;

  try {
    let data = await db
      .getDb()
      .collection("groups")
      .findOne({ _id: new ObjectId(groupId) });
    groupName = data.name;
  } catch (err) {
    console.log("get/chatroom/:id : ERROR : Database fetch Error");
    console.log(err);
  }

  // console.log("userName", req.session.userName);

  res.render("chat", {
    chats: chats.reverse(),
    groupId: groupId,
    groupName: groupName,
    userId: req.session.userId,
    userName: req.session.userName,
  });
});

// Left to add
// CSRF Protection
// XSS Protection
app.post("/chatroom/:id", async function (req, res) {
  let body = await req.body;

  let name = req.session.userName;
  let userId = req.session.userId;
  let text = body.text;
  let groupId = new ObjectId(req.params.id);

  try {
    await db
      .getDb()
      .collection("chats")
      .insertOne({
        groupId: new ObjectId(groupId),
        text: text,
        sender: {
          name: name,
          id: userId,
        },
        send_on: new Date(),
      });
    console.log(`Message by ${name} recieved : ${text}`);
  } catch (err) {
    console.log(
      `post/chatroom/${groupId} : ERROR : Failed to save msg to database`
    );
    console.log(err);
  }

  const msgBlock = {
    senderName: name,
    msg: text,
  };
  const msgJSONString = JSON.stringify(msgBlock);

  try {
    // Send the message through correct socket
    // Distinguish between sender and reciever messages
    // console.log(userId);
    wss.clients.forEach(async function (ws) {
      if (ws.data.groupId.equals(groupId) && !ws.data.userId.equals(userId)) {
        ws.send(msgJSONString);
      }
    });
  } catch (err) {
    console.err("Failed sending msg to all users through socket");
    console.err(err);
  }
});

db.connectToDatabase()
  .then(function () {
    app.listen(3000);
  })
  .catch(function () {
    console.log("Failed to connect to Database!");
  });
