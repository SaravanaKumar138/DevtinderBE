const express = require("express");

const profileRouter = express.Router();

const { userAuth } = require("../middleware/auth");

const { validateProfileEdit } = require("../utils/validate");


const upload = require("../middleware/upload");
const uploadToS3 = require("../utils/s3upload");

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
   
    const loggedInUser = req.user; //already inserted in userAuth

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save();

    // res.send(`${loggedInUser.lastName} your profile updated successfully`);
    res.json({
      message: `${loggedInUser.lastName} your profile updated successfully`,
      data: loggedInUser,
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
});

profileRouter.post(
  "/profile-image",
  userAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }

      // Validate image type
      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Only images allowed" });
      }

      const user = req.user;

      // Upload to S3
      const imageUrl = await uploadToS3(req.file);

      // Save CDN URL in DB
      user.photoUrl = imageUrl;
      await user.save();

   res.json({
     message: "Profile image updated successfully",
     imageUrl,
     data: user,
   });
    } catch (err) {
      res.status(500).json({
        message: "Error uploading profile image",
        error: err.message,
      });
    }
  }
);

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
