const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../lib/auth");
const { createNewUser, deleteUser, validateUser, storeFileInfo, findFileByUrl, getFileListByUserId } = require("../lib/db");
const jwt = require("jsonwebtoken");

router.get("/", (req, res) => {
  res.status(200).json({ message: "FILE UPLOAD API ONLINE" });
});

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    // callback(null, "./fileReceived");
    callback(null, "E:/temp/upload");
  },
  filename: (req, file, cb) => {
    // cb(null, Date.now() + path.extname(file.originalname));
    cb(null, file.originalname);
  },
});

const uploadMiddleware = multer({ storage: storage });
router.post("/file/", uploadMiddleware.single("fileContent"), (req, res) => {
  res.send({ success: true });
});

// findFileByUrl("/2023/06/18/john constantine's book.jpg").then((file) => {
//   if (file === null) {
//     console.log("safe to save");
//   } else {
//     console.log(file);
//   }
// });

module.exports = router;
