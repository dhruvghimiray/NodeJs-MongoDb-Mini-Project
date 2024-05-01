const express = require("express");
const app = express();

const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userModel = require("./models/user");
const postModel = require("./models/post");
const { hasSubscribers } = require("diagnostics_channel");
const user = require("./models/user");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

const saltRounds = 10;

app.post("/register", async (req, res) => {
  const { name, username, password, age, email } = req.body;
  const existingUser = await userModel.findOne({ email });

  if (existingUser) {
    return res.status(500).send("User Already Registered");
  }

  bcrypt.genSalt(saltRounds, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const createdUser = await userModel.create({
        name,
        username,
        password: hash,
        age,
        email,
      });

      let token = jwt.sign({ email, userid: user._id }, "SecretKey");
      res.cookie("token", token);
      res.send("Registered");
    });
  });
});

app.get("/login", (req, res) => {
  res.render("Login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await userModel.findOne({ email });

  if (!existingUser) {
    return res.status(500).send("Somethign went wrong");
  }

  bcrypt.compare(password, existingUser.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email, userid: user._id }, "SecretKey");
      res.cookie("token", token);
      res.status(200).send("You can login");
    } else res.redirect("/login");
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/profile", isLoggedIn, (req, res) => {
  console.log(req.user);
  res.send("welcome to profile");
});

function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") {
    res.send("you must be logged in");
  } else {
    let data = jwt.verify(req.cookies.token, "SecretKey");
    req.user = data;
    next();
  }
}

app.listen(3000, () => console.log("server is running on port 3000"));
