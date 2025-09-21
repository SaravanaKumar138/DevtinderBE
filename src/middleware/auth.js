const jwt = require("jsonwebtoken");

const User = require("../models/user");

const userAuth = async (req, res, next) => {
    
  try {
    const { token } = req.cookies;

    if (!token) return res.status(401).send("Please login");

    const decodedMessage = jwt.verify(token, "secretkey");

    const { _id } = decodedMessage;

    const user = await User.findById(_id);

    if (!user) {
      return res.status(401).send("Please Login");
    }

    req.user = user;
    
    next();
  } catch (err) {
    res.status(400).send("Error " + err.message);
  }
};

module.exports = { userAuth };
