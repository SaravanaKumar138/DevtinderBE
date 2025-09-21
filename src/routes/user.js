const express = require("express");

const { userAuth } = require("../middleware/auth");

const ConnectionRequest = require("../models/connectionRequest");

const userRouter = express.Router();

const User = require("../models/user");

userRouter.get("/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    //toUserId === loogedInUser && status shoould be interested
    const connectionRequest = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", ["firstName", "lastName", "photoUrl", "age", "gender"]);
    // if (!connectionRequest) {
    //   return res.status(400).json({ message: "Connection Request not found" });
    // }
    return res.json({
      message: "Data fetched successfully",
      data: connectionRequest,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

userRouter.get("/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // const connectionRequest = await ConnectionRequest.find({
    //   $or: [
    //     { toUserId: loggedInUser._id, status: "accepted" },
    //     { fromUserId: loggedInUser._id, status: "accepted" },
    //   ],
    // }).populate("fromUserId", ["firstName", "lastName", "photoUrl", "age", "gender", "about"]);

    // const data = connectionRequest.map((request) => request.fromUserId); //sending only the request

    // res.json({ data }
    // );
    const connectionRequest = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", [
        "firstName",
        "lastName",
        "photoUrl",
        "age",
        "gender",
        "about",
      ])
      .populate("toUserId", [
        "firstName",
        "lastName",
        "photoUrl",
        "age",
        "gender",
        "about",
      ]);

    const data = connectionRequest.map((request) => {
      if (request.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return request.toUserId;
      } else {
        return request.fromUserId;
      }
    });

    res.json({ data });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    //User should see all other user card other than him
    //should not see person whom the loggedIn person sent request already
    //should not see ignored person
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit; //formula for skip
    //find all connection request send and recieved of loggedIn User
    const connectionRequest = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId"); //select only fromuserId and toUserId

    const blockuserFromFeed = new Set();
    connectionRequest.forEach((req) => {
      blockuserFromFeed.add(req.fromUserId.toString());
      blockuserFromFeed.add(req.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(blockuserFromFeed) } },
        { _id: { $nin: loggedInUser._id } },
      ],
    })
      .select("firstName lastName photoUrl about skills age")
      .skip(skip)
      .limit(limit);

    res.send(users);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = userRouter;
