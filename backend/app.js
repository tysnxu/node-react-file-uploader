const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");

const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 3000;

const apiRouter = require("./routes/api");
app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`LISTENING ON PORT ${PORT}`);
});
