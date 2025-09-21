const express = require("express");

const app = express();

const cors = require("cors");

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);


const connectDB = require("./config/database");

const cookieParser = require("cookie-parser");

app.use(express.json());

app.use(cookieParser());

const authRouter = require("./routes/auth");

const profileRouter = require("./routes/profile");

const requestRouter = require("./routes/request");

const userRouter = require("./routes/user");

app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/request", requestRouter);
app.use("/user", userRouter);

connectDB()
  .then(() => {
    console.log("DB connected");
    app.listen(7777, () => {
      console.log("Server listening");
    });
  })
  .catch((err) => console.log(err));


//export from the file 
//import here like const requestrouter = require("./routes/auth.js");
//app.use("/user", requestrouter);