const ejs = require("ejs");
const path = require("path");
const express = require("express");

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

app.get("/", function (req, res) {
  res.redirect("/home");
});

app.get("/home", function (req, res) {
  res.render("home");
});


app.get("/chatroom/:id",function(req,res){
  console.log(req.params.id)

  
})

app.listen(3000);
