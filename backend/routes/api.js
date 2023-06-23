const express = require("express");
const router = express.Router();
const { createNewUser, deleteUser, validateUser, storeFileInfo, findFileByUrl, getFileListByUserId } = require("../lib/db");

const userApiRouter = require("./userApi");
const filesApiRouter = require("./filesApi");

router.use("/user", userApiRouter);
router.use("/file", filesApiRouter);

module.exports = router;
