const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "*" }));

const PORT = 3000;

const apiRouter = require("./routes/api");
const uploadRouter = require("./routes/upload");

app.use("/api", apiRouter);
app.use("/upload", uploadRouter);

// storeFileInfo("monabba.jpg", "b65be946-d869-4028-8d30-3af85c038170", "/2023/06/18/monabba.jpg")
//   .then((newFile) => {
//     console.log(newFile);
//   })
//   .catch((err) => {
//     if (err.message.includes("Unique constraint failed on the constraint: `File_url_key`")) {
//       console.log("Name exists");
//     }
//   });

// getFileListByUserId("530a2d64-1d97-4068-85d9-36aada8d87b7").then((fileList) => {
//   console.log(fileList);
// });

app.listen(PORT, () => {
  console.log(`LISTENING ON PORT ${PORT}`);
});
