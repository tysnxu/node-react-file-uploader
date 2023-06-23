const express = require("express");
const router = express.Router();
const auth = require("../lib/auth");
const { createNewUser, deleteUser, validateUser, storeFileInfo, findFileByUrl, getFileListByUserId } = require("../lib/db");
const jwt = require("jsonwebtoken");

router.get("/", (req, res) => {
  res.status(200).json({ message: "FILE UPLOAD API ONLINE" });
});

// CREATE USER
router.post("/new", (req, res) => {
  createNewUser().then((newUser) => {
    const newToken = jwt.sign({ uuid: newUser.id }, process.env.ACCESS_TOKEN_SECRET);
    res.status(200).json({ token: newToken });
  });
});

router.post("/login", auth, async (req, res) => {
  res.status(200).json({ message: "login successful" });
});

router.get("/files/", auth, (req, res) => {
  const userId = res.locals.userId;
  getFileListByUserId(userId).then((files) => {
    // console.log(files);
    res.status(200).json({ files: files });
  });
});

module.exports = router;
