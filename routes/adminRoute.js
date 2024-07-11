const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/docModel");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/get-all-users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false });
    res.status(200).send({
      message: "Users loaded",
      success: true,
      data: users,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Error in loading users", success: false, error });
  }
});

router.get("/get-all-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    res.status(200).send({
      message: "Doctors loaded",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Error in loading doctors", success: false, error });
  }
});

router.post("/approve-doctor", authMiddleware, async (req, res) => {
  try {
    const { doctorId, status, userId, fname, lname } = req.body;

    // Update the doctor's status
    const doctor = await Doctor.findByIdAndUpdate(doctorId, { status });

    // Find the user and update their notifications and isDoctor flag
    const user = await User.findById(userId);
    const unseenNotifications = user.unseenNotifications;
    if (status === "approved") {
      user.isDoctor = true;
    }
    unseenNotifications.push({
      message: `Doctor Application from ${fname} ${lname} has been ${status}`,
      link: `/dashboard`,
    });
    await User.findByIdAndUpdate(user._id, {
      unseenNotifications,
      isDoctor: user.isDoctor,
    });

    res.status(200).send({
      message: "Doctor approved and user notified",
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error("Error in /approve-doctor route:", error);
    res.status(500).send({
      message: "Error in Approving Doctor",
      success: false,
      error,
    });
  }
});

module.exports = router;
