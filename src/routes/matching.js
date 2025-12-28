const express = require("express");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const { userAuth } = require("../middleware/auth");

const matchingRouter = express.Router();

matchingRouter.get("/match", userAuth, async (req, res) => {
  try {
    const { skills } = req.query;
    if (!skills) {
      return res.status(400).json({ message: "Skills required" });
    }

    const loggedInUser = req.user;

    // normalize requested skills
    const skillsArray = skills.split(",").map((s) => s.trim().toLowerCase());

    const friends = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
      status: { $in: ["accepted", "pending", "rejected"] },
    }).select("fromUserId toUserId -_id");

    
    const excludedIds = new Set();
    friends.forEach((conn) => {
      excludedIds.add(conn.fromUserId);
      excludedIds.add(conn.toUserId);
    });

    // always exclude self
    excludedIds.add(loggedInUser._id); // user dont have friends

    const candidateUsers = await User.find({
      _id: { $nin: Array.from(excludedIds) },
    });


     
    const EXP_FACTOR = 4;

    const matchedUsers = candidateUsers
      .map((user) => {
        const userSkills = (user.skills || []).map((s) => s.toLowerCase());

        const commonSkills = skillsArray.filter((skill) =>
          userSkills.includes(skill)
        );

        if (commonSkills.length === 0) return null;

        const skillScore = (commonSkills.length / skillsArray.length) * 60;

        const expDifference =
          (user.experience || 0) - (loggedInUser.experience || 0);

        const experienceScore = Math.max(
          0,
          Math.min(expDifference * EXP_FACTOR, 40)
        );

        return {
          ...user.toObject(),
          matchPercentage: Math.round(skillScore + experienceScore),
          skillsMatch: commonSkills.length,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    return res.status(200).json({
      message: "Matched users fetched successfully",
      data: matchedUsers,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = matchingRouter;
