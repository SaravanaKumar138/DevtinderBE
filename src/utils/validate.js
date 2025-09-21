const validator = require("validator");

const validateUser = (req) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !lastName) throw new Error("Name is not valid");
  if (!validator.isEmail(emailId)) {
    throw new Error("Email is not valid");
  }
  if (!validator.isStrongPassword(password)) {
    throw new Error(
      "Password must be at least 8 characters with uppercase, lowercase, number, and symbol."
    );
  }
};

const validateProfileEdit = (req) => {
  const allowedEdits = [
    "firstName",
    "lastName",
    "gender",
    "age",
    "skills",
    "photoUrl",
    "about",
  ];
  const keysOfUser = req.body;
  const isValidUpdation = Object.keys(keysOfUser).every((key) =>
    allowedEdits.includes(key)
  );
  return isValidUpdation;
};

module.exports = { validateUser, validateProfileEdit };
