const express = require("express");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const { userAuth } = require("../middleware/auth");

const matchingRouter = express.Router();

const normalize = (value = "") => value.toString().trim().toLowerCase();
const slugifySkill = (value = "") => normalize(value).replace(/[^a-z0-9]/g, "");

const SKILL_ALIASES = {
  reactjs: "react",
  react: "react",
  node: "nodejs",
  nodejs: "nodejs",
  mongodb: "mongodb",
  mongo: "mongodb",
  springboot: "springboot",
  spring: "springboot",
};

const canonicalizeSkill = (value = "") => {
  const skillSlug = slugifySkill(value);
  return SKILL_ALIASES[skillSlug] || skillSlug;
};

const extractSkillName = (skill) => {
  if (!skill) return "";
  if (typeof skill === "string") return skill;
  if (typeof skill.name === "string" && skill.name.trim()) return skill.name;

  // Backward compatibility:
  // Older users saved skills as strings while current schema expects { name, level }.
  // Mongoose can cast those strings into objects with numeric keys ("0","1",...).
  const skillObject =
    (typeof skill.toObject === "function" && skill.toObject()) ||
    skill._doc ||
    skill;

  const legacySkillFromNumericKeys = Object.keys(skillObject)
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => skillObject[key])
    .join("");

  return legacySkillFromNumericKeys || "";
};

matchingRouter.get("/match", userAuth, async (req, res) => {
  try {
    const { skills, minExperience, maxExperience } = req.query;
    if (!skills) {
      return res.status(400).json({ message: "Skills required" });
    }

    const loggedInUser = req.user;

    // normalize requested skills and keep only unique values
    const requestedSkillsInput = Array.isArray(skills) ? skills.join(",") : skills;

    const requestedSkills = [
      ...new Set(
        requestedSkillsInput
          .split(",")
          .map((skill) => canonicalizeSkill(skill))
          .filter(Boolean),
      ),
    ];

    if (requestedSkills.length === 0) {
      return res.status(400).json({ message: "At least one valid skill is required" });
    }

    const friends = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
      status: "accepted",
    }).select("fromUserId toUserId -_id");

    const excludedIds = new Set();
    friends.forEach((conn) => {
      excludedIds.add(conn.fromUserId.toString());
      excludedIds.add(conn.toUserId.toString());
    });

    // always exclude self
    excludedIds.add(loggedInUser._id.toString());

    const candidateFilters = {
      _id: { $nin: Array.from(excludedIds) },
    };

    const candidateUsers = await User.find(candidateFilters);

    const SKILL_WEIGHT = 90;
    const EXPERIENCE_WEIGHT = 10;
    const parsedMinExperience = Number(minExperience);
    const parsedMaxExperience = Number(maxExperience);
    const hasExperienceRange =
      !Number.isNaN(parsedMinExperience) && !Number.isNaN(parsedMaxExperience);

    const matchedUsers = candidateUsers
      .map((user) => {
        const userSkills = [
          ...new Set(
            (user.skills || [])
              .map((skill) => canonicalizeSkill(extractSkillName(skill)))
              .filter(Boolean),
          ),
        ];

        const commonSkills = requestedSkills.filter((skill) =>
          userSkills.includes(skill)
        );

        if (commonSkills.length === 0) return null;

        // Skills dominate the score. More shared skills => much higher rank.
        const skillScore =
          (commonSkills.length / requestedSkills.length) * SKILL_WEIGHT;

        const userExperience = Number(user.experience || 0);
        let experienceScore = EXPERIENCE_WEIGHT;
        let isInExperienceRange = true;

        if (hasExperienceRange) {
          isInExperienceRange =
            userExperience >= parsedMinExperience &&
            userExperience <= parsedMaxExperience;
          // If candidate is outside selected range, give lowest possible exp points.
          experienceScore = isInExperienceRange ? EXPERIENCE_WEIGHT : 0;
        }

        return {
          ...user.toObject(),
          matchPercentage: Math.round(skillScore + experienceScore),
          skillsMatch: commonSkills.length,
          commonSkills,
          isInExperienceRange,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        if (b.skillsMatch !== a.skillsMatch) {
          return b.skillsMatch - a.skillsMatch;
        }
        return (a.isInExperienceRange === b.isInExperienceRange)
          ? 0
          : (b.isInExperienceRange ? 1 : -1);
      })
      .slice(0, 10);

    return res.status(200).json({
      message: "Matched users fetched successfully",
      data: matchedUsers,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = matchingRouter;
