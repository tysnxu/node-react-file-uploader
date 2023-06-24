const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../lib/auth");
const { updateFile, getFileById } = require("../lib/db");
const UploadStatus = require("@prisma/client");

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    // callback(null, "./fileReceived");
    callback(null, "E:/temp/upload");
  },
  filename: (req, file, cb) => {
    // cb(null, Date.now() + path.extname(file.originalname));
    let fileName = Buffer.from(file.originalname, "latin1").toString("utf-8");
    cb(null, fileName);
  },
});

const uploadMiddleware = multer({ storage: storage });
router.post("/", auth, uploadMiddleware.single("fileContent"), (req, res) => {
  const userId = res.locals.userId;
  const { fileId } = req.body;

  getFileById(fileId)
    .then((file) => {
      // CHECK IF USER OWNS THE FILE
      if (file.userId === userId) {
        updateFile(fileId, { status: "SUCCESSFUL" })
          .then((updatedFile) => {
            res.send({ success: true, file: { ...updatedFile } });
          })
          .catch((err) => {
            res.status(401).send({ success: false, message: "failed to change file status" });
          });
      } else {
        res.status(401).send({ success: false, message: "you do not have the previlege" });
      }
    })
    .catch(() => {
      res.status(400).send({ success: false, message: "file does not exist" });
    });
});

// findFileByUrl("/2023/06/18/john constantine's book.jpg").then((file) => {
//   if (file === null) {
//     console.log("safe to save");
//   } else {
//     console.log(file);
//   }
// });

module.exports = router;
