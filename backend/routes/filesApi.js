const express = require("express");
const router = express.Router();
const path = require("node:path");
const auth = require("../lib/auth");
const { createFile, findFileByUrl, getFileListByUserId, getFileById, updateFile } = require("../lib/db");
const multer = require("multer");
const fs = require("fs");

const fileStoreLocation = "E:/temp/upload";
const padNumber = (number) => String(number).padStart(2, "0");

const getDate = () => {
  let dateNow = new Date();
  return `${dateNow.getUTCFullYear()}${padNumber(dateNow.getUTCMonth() + 1)}${padNumber(dateNow.getUTCDate())}`;
};

router.get("/", (req, res) => {
  res.status(200).json({ message: "FILE UPLOAD API ONLINE" });
});

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const folder = getDate();
    req.res.locals.folder = folder;

    let fullPathOnDisk = path.join(fileStoreLocation, folder);
    fs.mkdirSync(fullPathOnDisk, { recursive: true });
    callback(null, fullPathOnDisk);
  },
  filename: (req, file, cb) => {
    let fileName = Buffer.from(file.originalname, "latin1").toString("utf-8");
    let folder = req.res.locals.folder;

    const extension = path.extname(fileName);
    const nameNoExtension = path.parse(fileName).name;

    let tries = 0;
    let fullFileName = `${nameNoExtension}${extension}`;

    while (fs.existsSync(path.join(fileStoreLocation, folder, fullFileName))) {
      tries++;
      fullFileName = `${nameNoExtension}-${tries}${extension}`;
    }

    // console.log("CONFIRMED:", fullFileName);
    req.res.locals.fileName = fullFileName;
    req.res.locals.url = path.join(folder, fullFileName);
    cb(null, fullFileName);
  },
});

router.post("/upload/", auth, multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }).single("fileContent"), (req, res) => {
  const userId = res.locals.userId; // AUTOMATIC USER ID EXTRACTION

  const fileName = res.locals.fileName; // FROM MULTER
  // const fileFolder = res.locals.folder; // FROM MULTER
  const fileURL = res.locals.url; // FROM MULTER

  // CREATE FILE OBJ IN DB
  createFile(fileName, userId, fileURL)
    .then((newFile) => {
      res.send({
        success: true,
        file: {
          fileName: newFile.fileName,
          id: newFile.id,
          uploadedAt: newFile.uploadedAt,
          url: newFile.url,
        },
      });
    })
    .catch((err) => res.status(500).json({ success: false, message: "Failed to create file in database" }));
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
