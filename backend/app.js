const express = require("express");
const multer = require("multer");
const path = require("node:path");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "*" }));

const { createNewUser, deleteUser, validateUser, storeFileInfo, findFileByUrl, getFileListByUserId } = require("./lib/db");

const PORT = 3000;

const apiRouter = require("./routes/api");

app.use("/api", apiRouter);
// const storage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     // callback(null, "./fileReceived");
//     callback(null, "E:/temp/upload");
//   },
//   filename: (req, file, cb) => {
//     console.log(file);
//     // cb(null, Date.now() + path.extname(file.originalname));
//     cb(null, file.originalname);
//   },
// });

// const uploadMiddleware = multer({ storage: storage });

// storeFileInfo("monabba.jpg", "b65be946-d869-4028-8d30-3af85c038170", "/2023/06/18/monabba.jpg")
//   .then((newFile) => {
//     console.log(newFile);
//   })
//   .catch((err) => {
//     if (err.message.includes("Unique constraint failed on the constraint: `File_url_key`")) {
//       console.log("Name exists");
//     }
//   });

// findFileByUrl("/2023/06/18/john constantine's book.jpg").then((file) => {
//   if (file === null) {
//     console.log("safe to save");
//   } else {
//     console.log(file);
//   }
// });

// getFileListByUserId("530a2d64-1d97-4068-85d9-36aada8d87b7").then((fileList) => {
//   console.log(fileList);
// });

// // TODO - GET PREVIOUS APIS BASED ON UUID
// app.get("/api/uploads", (req, res) => {});

// app.post("/upload", uploadMiddleware.single("fileContent"), (req, res) => {
//   res.send({ success: true });
// });

// console.log("ENV", process.env.USER_ID);

app.listen(PORT, () => {
  console.log(`LISTENING ON PORT ${PORT}`);
});

// console.log(users);

// createNewUser();
