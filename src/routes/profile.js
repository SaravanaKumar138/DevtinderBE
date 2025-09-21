const express = require("express");

const profileRouter = express.Router();

const { userAuth } = require("../middleware/auth");

const { validateProfileEdit } = require("../utils/validate");

const validator = require("validator");

const bcrypt = require("bcrypt");

profileRouter.get("/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(404).send(err.message);
  }
});

profileRouter.patch("/edit", userAuth, async (req, res) => {
  try {
    if (!validateProfileEdit(req)) throw new Error("Cannot Edit Profile");

    const loggedInUser = req.user; //already inserted in userAuth

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save();

    // res.send(`${loggedInUser.lastName} your profile updated successfully`);
    res.json({
      message: `${loggedInUser.lastName} your profile updated successfully`,
      data: loggedInUser,
    });
    
  } catch (err) {
    res.status(400).send(err.message);
  }
});

profileRouter.patch("/password", userAuth, async (req, res) => {
  try {
    const { password } = req.body;
    
    console.log(password);
    
    if (!validator.isStrongPassword(password)) {
      throw new Error("Password is not strong");
    }
    
    const user = req.user;
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    user.password = passwordHash;
    
    await user.save();

    res.send("Password changed sucessfully");
  } catch (err) {
    res.status(400).send("Error in changing the password " + err.message);
  }
});

module.exports = profileRouter;
