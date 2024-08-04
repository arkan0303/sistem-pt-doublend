const express = require("express");
const path = require("path");
const { title } = require("process");
const app = express();
const port = 5000;
const hbs = require("hbs");

//setup hbs
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "src/views"));

// set stastic file server
app.use(express.static("src/assets"));

// parsing data form client
app.use(express.urlencoded({ extended: false }));

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/", (req, res) => {
  res.render("index");
});
