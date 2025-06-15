const ejs = require("ejs");
const path = require("path");
const express = require("express");
const db = require("./database/data.js");
const { ObjectId } = require("mongodb");

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

app.get("/", function (req, res) {
  res.redirect("/home");
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

  // Check if username already exists in database, if no send error
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

app.get("/home", async function (req, res) {
  let groups;

  try {
    groups = await db.getDb().collection("groups").find().toArray();
  } catch (err) {
    console.log("get/home : ERROR : Database Fetch Error");
    console.log(err);
  }

  res.render("home", { groups: groups });
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

  res.render("chat", {
    chats: chats.reverse(),
    groupName: groupName,
    groupId: groupId,
    userId: new ObjectId("6849a223ee2333b89cc59f36"),
  });
});

// Left to add
// CSRF Protection
// XSS Protection
app.post("/chatroom/:id", async function (req, res) {
  let body = await req.body;

  let name = "Tuchar";
  let userId = new ObjectId("6849a223ee2333b89cc59f36");
  let text = body.text;
  let groupId = req.params.id;

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
});

db.connectToDatabase()
  .then(function () {
    app.listen(3000);
  })
  .catch(function () {
    console.log("Failed to connect to Database!");
  });
