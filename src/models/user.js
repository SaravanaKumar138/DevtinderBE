
// //Connection String: mongodb+srv://DevtinderProject:devtinder@firstnode.ufnnpwj.mongodb.net/

const mongoose = require("mongoose");
const { validate } = require("./connectionRequest");

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
    },
    emailId: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      unique: true,//if field is unique mongodb automatically creates index for it
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
      trim: true,
    },
    age: {
      type: String,
      min: 18,
      trim: true,
    },
    gender: {
      type: String,
      validate(value) {
        if (!["male", "female", "others"].includes(value)) {
          throw new Error("Not a valid gender");
        }
      },
      //or you can write like this also
      // enum: {
      //   values: ["male", 'female', 'others'],
      //   message: `{value} is not a valid gender type`
      // },
      trim: true,
    },
    photoUrl: {
      type: String,
      default:
        "https://tse1.mm.bing.net/th/id/OIP.dEqE1bhrjga0pNP3WjZ7TQAAAA?pid=Api&P=0&h=220",
      trim: true,
    },
    about: {
      type: String,
      defalut: "This is default description",
      trim: true,
    },
    skills: {
      type: [String],
      maxlength: 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);


