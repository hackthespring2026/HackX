const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// User schema with health profile embedded
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    // Health profile for personalized alerts
    healthProfile: {
      age: { type: Number, default: 25 },
      asthma: { type: Boolean, default: false },
      heartProblem: { type: Boolean, default: false },
      diabetes: { type: Boolean, default: false },
      pregnant: { type: Boolean, default: false },
      outdoorHours: { type: Number, default: 2 },
      exercise: { type: String, default: "light" },
    },
    // Challenge / gamification data
    challenge: {
      points: { type: Number, default: 0 },
      co2Saved: { type: Number, default: 0 },
      level: { type: String, default: "Starter" },
      actions: [{ action: String, date: Date, points: Number }],
    },
    city: { type: String, default: "Delhi" },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
