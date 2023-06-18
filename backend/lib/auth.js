const jwt = require("jsonwebtoken");
const { createNewUser, deleteUser, validateUser, storeFileInfo, findFileByUrl, getFileListByUserId } = require("./db");

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!(token && token.substring(0, 7) === "Bearer ")) {
      // NO VALID JWT
      return res.status(400).json({ message: "Invalid login info, login failed" });
    }

    const requestJWT = req.headers.authorization.split(" ")[1];

    jwtResult = jwt.verify(requestJWT, process.env.ACCESS_TOKEN_SECRET, (err, result) => {
      res.locals.userId = result.uuid;
      if (err) return res.status(401).json({ message: "Invalid JWT, login failed" });
      validateUser(result.uuid).then((validResult) => {
        // Validate if user exist in our database

        if (validResult != true) {
          return res.status(401).json({ message: "User not found, login failed" });
        }

        next();
        return;
      });
    });
  } catch (error) {
    if (error.message === "Cannot destructure property 'token' of 'req.body' as it is undefined.") {
      return res.status(401).json({ message: "Unauthorized, No Token" });
    }
  }
};

module.exports = auth;
