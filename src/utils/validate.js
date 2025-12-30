const validator = require("validator");
const validateProfileEdit = (req) => {
  if (!req.body || typeof req.body !== "object") return false;

  const allowedEdits = new Set([
    "firstName",
    "lastName",
    "gender",
    "experience",
    "age",
    "role",
    "skills",
    "photoUrl",
    "about",
  ]);

  const keys = Object.keys(req.body).filter(
    (key) => req.body[key] !== undefined
  );

  if (keys.length === 0) return false;

  return keys.every((key) => allowedEdits.has(key));
};

module.exports = { validateUser, validateProfileEdit };
