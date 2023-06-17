const express = require("express");
const multer = require("multer");
const path = require("node:path");
require("dotenv").config();

const PORT = 3000;
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    // callback(null, "./fileReceived");
    callback(null, "E:/temp/upload");
  },
  filename: (req, file, cb) => {
    console.log(file);
    // cb(null, Date.now() + path.extname(file.originalname));
    cb(null, file.originalname);
  },
});

const uploadMiddleware = multer({ storage: storage });

const app = express();
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("upload");
});

// TODO - GET NEW USER ID

// TODO - GET PREVIOUS APIS BASED ON UUID
app.get("/api/uploads", (req, res) => {});

app.post("/upload", uploadMiddleware.single("fileContent"), (req, res) => {
  res.send({ success: true });
});

console.log("ENV", process.env.USER_ID);

app.listen(PORT, () => {
  console.log(`LISTENING ON PORT ${PORT}`);
});
