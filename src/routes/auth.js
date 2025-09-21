const express = require("express");

const authRouter = express.Router();

const { validateUser } = require("../utils/validate");

const validator = require("validator");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const User = require("../models/user");

authRouter.post("/signUp", async (req, res) => {
  //validate the data
  try {
    validateUser(req);
    const {
      firstName,
      lastName,
      emailId,
      password,
      skills,
      age,
      gender,
      about,
    } = req.body;
    const encryptedpassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: encryptedpassword,
      skills,
      age,
      gender,
      about,
    });
    const saveduser = await user.save();
    const token = await jwt.sign({ _id: user._id }, "secretkey", {
      expiresIn: "1d", //expiry for jwt token
    });
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3400000), //expiry for cookie
    });
    res.json({message: "User added ssuccessfully", data: saveduser});
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!validator.isEmail(emailId)) {
      throw new Error("Email Id is not valid");
    }

    const user = await User.findOne({ emailId: emailId }); //check email validation

    if (!user) {
      throw new Error("Invalid Credentials");
    }

    const isPassValid = await bcrypt.compare(password, user.password); //check password validation

    if (isPassValid) {

      const token = await jwt.sign({ _id: user._id }, "secretkey", {
        expiresIn: "1d", //expiry for jwt token
      });

      res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 8 * 3400000), //expiry for cookie
      });
      
      res.send(user);
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("Logged Out successfully");
});

module.exports = authRouter;
