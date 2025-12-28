const User = require("../models/user");

const express = require("express");
const { userAuth } = require("../middleware/auth");
const ConnectionRequest = require("../models/connectionRequest");

const matchingRouter = express.Router();
matchingRouter.get("/match", userAuth, async (req, res) => {
  try {
    const { skills } = req.query;
    if (!skills) {
      return res.status(400).json({ message: "Skills required" });
    }

    const skillsArray = skills.split(",").map((s) => s.trim().toLowerCase());

    const loggedInUser = req.user;

    const allUsers = await User.find();

    const friendsOfLoggedInUser = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
      status: "accepted",
    }).select("fromUserId toUserId -_id");

    const friendsIds = new Set();
    friendsOfLoggedInUser.forEach((conn) => {
      friendsIds.add(conn.fromUserId.toString());
      friendsIds.add(conn.toUserId.toString());
    });

  
    friendsIds.add(loggedInUser._id.toString()); // what if the user has no friends

    const EXP_FACTOR = 4;

    const matchedUsers = allUsers
      .filter((user) => !friendsIds.has(user._id.toString()))
      .map((user) => {
        const userSkills = (user.skills || []).map((s) => s.toLowerCase());

        const commonSkills = skillsArray.filter((skill) =>
          userSkills.includes(skill)
        );

        const skillScore = (commonSkills.length / skillsArray.length) * 60;

        const expDifference =
          (user.experience || 0) - (loggedInUser.experience || 0);

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

    res.status(200).json({
      message: "All users received",
      data: matchedUsers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = matchingRouter;