const express = require("express");

const requestRouter = express.Router();

const { userAuth } = require("../middleware/auth");

const User = require("../models/user");

const ConnectionRequest = require("../models/connectionRequest");

requestRouter.post("/send/:status/:toUserId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const fromUserId = loggedInUser._id;
    const { toUserId, status } = req.params;

    //only ignored and interested are allowed
    const allowedStatus = ["ignored", "interested"];
    if (!allowedStatus.includes(status)) {
      return res
        .status(400)
        .json({ message: `Invalid status type: ${status}` });
    }

    //what if toUser not found
    const toUser = await User.findOne({ _id: toUserId });
    if (!toUser) {
      return res.status(400).json({ message: "User not found" });
    }

    //finding exixting connection request
    const existingConnectionRequest = await ConnectionRequest.findOne({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
    });

    if (existingConnectionRequest) {
      return res.status(400).json({ message: "Connection already exists" });
    }

    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status,
    });
    //saving to database
    await connectionRequest.save();

    res.json({
      message: `Connection Request ${status} by ${fromUserId.lastName}`,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

requestRouter.post("/review/:status/:requestId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    //validate the status
    const { status, requestId } = req.params;

    const allowedStatus = ["accepted", "rejected"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    //taking the connection request
    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", "lastName");

    if (!connectionRequest) {
      return res.status(400).json({ message: "Connection request not found" });
    }

    connectionRequest.status = status;

    await connectionRequest.save();

    res.send(
      `${connectionRequest.fromUserId.lastName}'s connection request has been ${status} successfully`
    );
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = requestRouter;
