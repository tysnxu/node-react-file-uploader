const express = require("express");
const router = express.Router();
const path = require("node:path");
const auth = require("../lib/auth");
const { createFile, findFileByUrl, getFileListByUserId, getFileById } = require("../lib/db");

// LOAD UPLOAD API
const uploadRouter = require("./upload");
router.use("/upload", uploadRouter);

router.get("/", (req, res) => {
  res.status(200).json({ message: "FILE UPLOAD API ONLINE" });
});

// CREATE NEW FILE
router.post("/new", auth, (req, res) => {
  const userId = res.locals.userId; // AUTOMATIC USER ID EXTRACTION
  const { fileName } = req.body;
  const padNumber = (number) => String(number).padStart(2, "0");

  let dateNow = new Date();
  let folder = `${dateNow.getUTCFullYear()}.${padNumber(dateNow.getUTCMonth() + 1)}.${padNumber(dateNow.getUTCDate())}`;
  let url = path.join(folder, fileName);

  createFile(fileName, userId, url)
    .then((newFile) => {
      res.status(200).json({
        fileName: newFile.fileName,
        id: newFile.id,
        uploadedAt: newFile.uploadedAt,
        url: newFile.url,
      });
    })
    .catch((err) => {
      // TODO: CHECK IF THE FILE URL ALREADY EXISTS - IF SO APPEND SHIT TO THE FILE NAME
      if (err.message.includes("Unique constraint failed on the constraint: `File_url_key`")) {
        res.status(300).json({ message: "FILE EXISTS" });
      }
    });
});

router.delete("/file/:id", auth, (req, res) => {
  const userId = res.locals.userId;
  const fileId = req.id;

  // TODO: UPDATE THE DATABASE TO SET FILE AS DELETED

  console.log(fileId);

  // getFileById();

  // getFileListByUserId(userId).then((files) => {
  //   // console.log(files);
  //   res.status(200).json({ files: files });
  // });
});

module.exports = router;
