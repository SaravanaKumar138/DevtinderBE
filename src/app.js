const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const connectDB = require("./config/database");
const initializeSocket = require("./utils/socket");

// 🔥 IMPORT WEBHOOK HANDLER (NOT ROUTER)
const webhookHandler = require("./routes/paymentWebhook");

// ===============================
// ✅ 1. RAZORPAY WEBHOOK (RAW BODY)
// ===============================
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  webhookHandler
);

// ===============================
// ❌ 2. JSON PARSER AFTER WEBHOOK
// ===============================
app.use(express.json());
app.use(cookieParser());

// ===============================
// 3. CORS
// ===============================
app.use(
  cors({
    origin: [
      "https://devstinder.in",
      "https://www.devstinder.in",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

// ===============================
// 4. ROUTERS
// ===============================
app.use("/auth", require("./routes/auth"));
app.use("/profile", require("./routes/profile"));
app.use("/request", require("./routes/request"));
app.use("/user", require("./routes/user"));
app.use("/chat", require("./routes/chat"));
app.use("/payment", require("./routes/payment"));
app.use("/matches", require("./routes/matching"));

// ===============================
// 5. SERVER
// ===============================
const server = http.createServer(app);
initializeSocket(server);

connectDB()
  .then(() => {
    console.log("DB connected");
    server.listen(process.env.PORT, () => {
      console.log("Server listening on", process.env.PORT);
    });
  })
  .catch(console.error);

// const express = require("express");

// const app = express();

// const cors = require("cors");

// const http = require("http");

// require("dotenv").config();

// app.use(
//   cors({
//     origin: [
//       "https://devstinder.in",
//       "https://www.devstinder.in",
//       "http://localhost:5173",
//     ],
//     methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
//     credentials: true,
//   })
// );

// const connectDB = require("./config/database");

// const cookieParser = require("cookie-parser");

// app.use(express.json());

// app.use(cookieParser());

// const authRouter = require("./routes/auth");

// const profileRouter = require("./routes/profile");

// const requestRouter = require("./routes/request");

// const userRouter = require("./routes/user");

// const chatRouter = require("./routes/chat");

// const paymentRouter = require("./routes/payment");

// const matchingRouter = require("./routes/matching");

// const initializeSocket = require("./utils/socket");

// app.use("/auth", authRouter);
// app.use("/profile", profileRouter);
// app.use("/request", requestRouter);
// app.use("/user", userRouter);
// app.use("/chat", chatRouter);
// app.use("/payment", paymentRouter);
// app.use("/matches", matchingRouter);

// const server = http.createServer(app);

// initializeSocket(server);

// connectDB()
//   .then(() => {
//     console.log("DB connected");
//     server.listen(process.env.PORT,() => {
//       console.log("Server listening ",process.env.PORT);
//     });
//   })
//   .catch((err) => console.log(err));
