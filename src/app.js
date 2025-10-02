const express = require("express");

const app = express();

const cors = require("cors");

const http = require("http");

require("dotenv").config();

app.use(
  cors({
    origin: "http://localhost:5173",
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

const chatRouter = require("./routes/chat");

const initializeSocket = require("./utils/socket");

app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/request", requestRouter);
app.use("/user", userRouter);
app.use("/chat", chatRouter);

const server = http.createServer(app);

initializeSocket(server);

connectDB()
  .then(() => {
    console.log("DB connected");
    server.listen(process.env.PORT, () => {
      console.log("Server listening ",process.env.PORT);
    });
  })
  .catch((err) => console.log(err));


