const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://DevtinderProject:Dev%401234@firstnode.ufnnpwj.mongodb.net/devtinder?retryWrites=true&w=majority",
    {
      ssl: true,
      tlsAllowInvalidCertificates: true, // Only for testing
      serverSelectionTimeoutMS: 30000, // 30 second timeout
    } // refering to database in cluster in compass
  );
};

module.exports = connectDB;

// userName: "DevtinderProject"
// password: ":Dev%401234"

