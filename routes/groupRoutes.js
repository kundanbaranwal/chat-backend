const express = require("express");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const Group = require("../models/GroupModel");
const groupRouter = express.Router();
//    route for group creation
groupRouter.post("/", protect, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.create({
      name,
      description,
      admin: req.user._id,
      members: [req.user._id],
    });
    const populateGroup = await Group.findById(group._id)
      .populate("admin", "username emai")
      .populate("members", "username email");
    res.status(201).json({ populateGroup });
  } catch (error) {
    res.status(400).json({ message: "group route error" });
  }
});

//route for getting all groups
groupRouter.get("/", protect, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("admin", "username email")
      .populate("members", "username email");
    res.json(groups);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//join group
groupRouter.post("/:groupId/join", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "group not found" });
    }
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ member: "user already a member" });
    }
    group.members.push(req.user._id);
    await group.save();
    res.json({ message: "joined group successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//leave a group
groupRouter.post("/:groupId/leave", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (!group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "Not a member of this group" });
    }
    group.members = group.members.filter((memberId) => {
      return memberId.toString() !== req.user._id.toString();
    });
    await group.save();
    res.json({ message: "Successfully left the group" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = groupRouter;
