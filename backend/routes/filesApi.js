const express = require("express");
const router = express.Router();
const path = require("node:path");
const auth = require("../lib/auth");
const { createFile, getFileById, updateFile } = require("../lib/db");
const multer = require("multer");
const fs = require("fs");

const fileStoreLocation = process.env.FILE_STORE_LOCATION; //"E:/temp/upload";
const deletedFileStore = process.env.DELETED_FILE_LOCATION; // "E:/temp/deleted";
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
    const userId = req.res.locals.userId;

    const relativePath = path.join(userId, getDate());
    req.res.locals.folder = relativePath;

    let fullPathOnDisk = path.join(fileStoreLocation, relativePath);
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

router.post("/upload/", auth, multer({ storage: storage, limits: { fileSize: 11 * 1024 * 1024 } }).single("fileContent"), (req, res) => {
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

router.delete("/:id", auth, (req, res) => {
  const userId = res.locals.userId;
  const fileId = req.params.id;

  getFileById(fileId).then((file) => {
    console.log(file);
    let fileURL = file.url;

    if (!file) {
      res.status(404).json({ success: false, message: "File not found." });
      return;
    }

    if (file.userId !== userId) {
      res.status(403).json({ success: false, message: "You do not own the file." });
      return;
    }

    updateFile(fileId, { deleted: true }).then((file) => {
      let origPath = path.join(fileStoreLocation, fileURL);
      let deletedPath = path.join(deletedFileStore, fileURL);

      fs.mkdirSync(path.join(deletedFileStore, path.dirname(fileURL)), { recursive: true });
      fs.rename(origPath, deletedPath, function (err) {
        if (err) {
          res.status(500).json({ success: false, message: "Cannot remove file." });
          return;
        }

        res.status(200).json({ file: file });
        return;
      });
    });
  });
});

module.exports = router;
