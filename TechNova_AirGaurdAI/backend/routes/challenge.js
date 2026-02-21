const express = require("express");
const router = express.Router();
const User = require("../models/User");
const protect = require("../utils/auth.middleware");

// Points for each action
const actionPoints = {
  transit: 50,
  tree: 200,
  smoke: 75,
  ev: 100,
  carpool: 60,
  wfh: 40,
  cycle: 80,
  noburn: 90,
};

// POST /api/challenge/update – Add points for an action
router.post("/update", protect, async (req, res) => {
  try {
    const { action } = req.body;
    const points = actionPoints[action] || 0;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $inc: { "challenge.points": points },
        $push: { "challenge.actions": { action, date: new Date(), points } },
      },
      { new: true }
    );

    // Update level based on points
    const totalPoints = user.challenge.points;
    let level = "Starter";
    if (totalPoints >= 5000) level = "Air Guardian";
    else if (totalPoints >= 2000) level = "Eco Champion";
    else if (totalPoints >= 1000) level = "Green Warrior";

    await User.findByIdAndUpdate(req.userId, { "challenge.level": level });

    res.json({ success: true, pointsAdded: points, totalPoints, level });
  } catch (err) {
    console.error("Challenge update error:", err);
    res.status(500).json({ error: "Failed to update challenge" });
  }
});

// GET /api/challenge/leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const leaders = await User.find({})
      .sort({ "challenge.points": -1 })
      .limit(10)
      .select("name city challenge.points challenge.level");

    res.json({ success: true, leaderboard: leaders });
  } catch (err) {
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

module.exports = router;
