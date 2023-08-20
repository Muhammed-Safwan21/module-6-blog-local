const express = require("express");
const app = express();
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const JWT = require("jsonwebtoken");
const path = require("path")
const mongoose = require('mongoose')

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../FrontEnd")));


mongoose.connect("mongodb://127.0.0.1:27017/FrontQ", {useNewUrlParser: true,useUnifiedTopology: true})
  .then((data) => {console.log(`DB connected with ${data.connection.host} `)})
  .catch((error) => {console.error("Error connecting to MongoDB:", error)});

  const userDetails = new mongoose.Schema({
    username: String,
    email:String,
    password: String,
  });
  let userData = mongoose.model("User", userDetails);



dotenv.config({ path: "./config/config.env" });


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../FrontEnd/index.html"));
  
});
app.post("/signup", async (req, res) => {

  try {

    const { username,email, password } = req.body;

    bcrypt.hash(password, 10 , function (err, hash) {
      if (err) {
        res.send(err.message);
      } else {
           // db 
  
        let newUser = new userData({
          username,
          email,
          password:hash,
        });
        newUser.save();
        console.log(req.body);

        res.redirect('/home')
      }
    });
  
    
  } catch (error) {

    console.log(error.message);
    res.redirect("/");
    
  }


});
app.get("/login", (req, res) => {
  const { token } = req.cookies;

  if (token) {
    JWT.verify(token, process.env.JWT_SECRET_KEY, function (err, result) {
      if (!err) {
        console.log("Signed in sucessfully")
        res.redirect("/home");
      } else {
        res.sendFile(path.join(__dirname, "../FrontEnd/signin.html"));
      }
    });
  } else {
    res.sendFile(path.join(__dirname, "../FrontEnd/signin.html"));
  }
});
 
app.post("/login",async (req, res) => {

  try {

    const { username, password } = req.body;

  const user = await userData.findOne({ username });

  if (!user) {
    console.log("User not found");
    res.redirect("/login");
  } else {
     bcrypt.compare(password, user.password, function (err, result) {
      if (err) {
        console.log("Error comparing passwords:", err);
        res.redirect("/login");
      } else if (result) {
        const data = {
          username,
          time: Date(),
        };
        const token = JWT.sign(data, process.env.JWT_SECRET_KEY, {
          expiresIn: "10min",
          
        });

        res.cookie("token", token).redirect("/home");
        console.log("User found");
      } else {
        console.log("Password did not match");
        res.redirect("/login");
      }
    });
  }
    
  } catch (error) {

    console.log(error.message)
    res.redirect("/login");
    
  }

  
});

app.get("/home", (req, res) => {
  const { token } = req.cookies;
  
  if (token) {
    JWT.verify(token, process.env.JWT_SECRET_KEY, function (err, result) {
      if (result) {
        res.sendFile(path.join(__dirname, "../FrontEnd/home.html"));
        
      } else {
        res.redirect("/login");
        
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.listen(process.env.PORT, () => {
  console.log(`server is running on ${process.env.PORT} port`);
});
