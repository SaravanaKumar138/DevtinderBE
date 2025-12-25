const User = require("../models/user");

const express = require("express");
const { userAuth } = require("../middleware/auth");

const matchingRouter = express.Router();

matchingRouter.get("/", userAuth, async (req, res) => {
  try {
    const { skills, experience } = req.query;
    console.log(skills, experience);
    if (!skills) {
      return res.status(400).json({ message: "Skills required" });
    }
    const skillsArray = skills.split(",").map((s) => s.trim().toLowerCase());
    console.log(skillsArray);
    const loggedInUser = req.user;
    const allUsers = await User.find();

    const EXP_FACTOR = 4;

    const matchedUsers = allUsers
      .filter((user) => user._id.toString() !== loggedInUser._id.toString())
      .map((user) => {
        const commonSkills = skillsArray.filter((skill) =>
          (user.skills || []).includes(skill)
        );
        const skillScore = (commonSkills.length / skillsArray.length) * 60;

        const expDifference = (user.experience || 0) - loggedInUser.experience;

        const experienceScore = Math.max(
          0,
          Math.min(expDifference * EXP_FACTOR, 40)
        );
        const matchPercentage = Math.round(skillScore + experienceScore);
        return {
          ...user.toObject(),
          matchPercentage,
          skillsMatch: commonSkills.length,
        };
      })
      .filter((u) => u.skillsMatch > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
    res.status(200).json({ message: "All users received", data: matchedUsers });
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

module.exports = matchingRouter;
