
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
    experience: {
      type: Number,
      default: 0,
      max: 50,
    },
    role: {
      type: String,
      default: "",
    },
    age: {
      type: Number,
      min: 18,
      trim: true,
    },
    gender: {
      type: String,
      validate(value) {
        if (!["male", "female", "other"].includes(value)) {
          throw new Error("Not a valid gender");
        }
      },
      trim: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    memberShipType: {
      type: String,
    },
    
    photoUrl: {
      type: String,
      default:
        "https://tse1.mm.bing.net/th/id/OIP.dEqE1bhrjga0pNP3WjZ7TQAAAA?pid=Api&P=0&h=220",
      trim: true,
    },
    about: {
      type: String,
      default: "This is default description",
      trim: true,
    },
    skills: 
       [{
        name: String, required: true, trim: true,
        level : {type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner'}
      }]
    ,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);


