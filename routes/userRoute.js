const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/docModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).send({
        message: "This email is already registered with an account",
        success: false,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const encpass = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: encpass,
    });
    await newUser.save();

    res.status(200).send({ message: "User created", success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Error in User Creation", success: false, error });
  }
});

router.post("/login", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (!existingUser) {
      return res.status(401).send({
        message: "User doesn't exist, please register",
        success: false,
      });
    }

    const isMatch = await bcrypt.compare(
      req.body.password,
      existingUser.password
    );
    if (!isMatch) {
      return res
        .status(401)
        .send({ message: "Incorrect Password", success: false });
    }

    const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res
      .status(200)
      .send({ message: "Login Successful", success: true, data: token });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

router.post("/get-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.password = undefined;
    if (!user) {
      return res
        .status(404)
        .send({ message: "User not found", success: false });
    } else {
      res.status(200).send({
        message: "Success",
        success: true,
        data: user,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error", success: false });
  }
});

router.post("/apply-doctor", authMiddleware, async (req, res) => {
  try {
    const newDoc = new Doctor(req.body);
    await newDoc.save();
    const admin = await User.findOne({ isAdmin: true });
    const unseenNotifications = admin.unseenNotifications;
    unseenNotifications.push({
      message: `New Doctor Application from ${req.body.fname} ${req.body.lname}`,
      link: `/admin/doctors`,
      data: {
        doctorId: newDoc._id,
        name: newDoc.fname,
      },
    });
    await User.findByIdAndUpdate(admin._id, { unseenNotifications });
    res.status(200).send({ message: "Application Successful", success: true });
  } catch (error) {
    console.error("Error in /apply-doctor route:", error);
    res
      .status(500)
      .send({ message: "Error in Applying Doctor", success: false, error });
  }
});

router.post("/mark-all-read", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    const unseenNotifications = user.unseenNotifications;
    const seenNotifications = user.seenNotifications;
    seenNotifications.push(...unseenNotifications);
    user.unseenNotifications = [];
    user.seenNotifications = seenNotifications;
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      message: "Marked all as read",
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error in /mark-all-read route:", error);
    res
      .status(500)
      .send({ message: "Error in marking all as read", success: false, error });
  }
});

router.post("/delete-notifs", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.seenNotifications = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      message: "Deleted all notifications",
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error in /delete-notifs route:", error);
    res
      .status(500)
      .send({ message: "Error in deleting all notifications", success: false });
  }
});

router.get("/get-approved-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "approved" });
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

router.post("/get-doctor-info-by-id", authMiddleware, async (req, res) => {
  try {
    const doc = await Doctor.findById(req.body.doctorId);
    if (!doc) {
      return res.status(404).send({
        message: "Doctor not found",
        success: false,
      });
    } else {
      res.status(200).send({
        message: "Success",
        success: true,
        data: doc,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error", success: false });
  }
});

router.post("/apply-appointment", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    const doctor = await Doctor.findById(req.body.doctorId);
    const docuser = await User.findById(doctor.userId);
    const unseenNotification = docuser.unseenNotifications;
    const docappoints = doctor.appointments;
    const userappointments = user.appointments;
    userappointments.push({
      doctorId: req.body.doctorId,
      selectedDate: req.body.date,
      selectedTime: req.body.selectedTime,
      doctorname: doctor.fname + " " + doctor.lname,
      status: "pending",
    });
    await User.findByIdAndUpdate(user._id, { appointments: userappointments });
    docappoints.push({
      userId: req.body.userId,
      selectedDate: req.body.date,
      selectedTime: req.body.selectedTime,
      username: req.body.username,
      status: "pending",
    });
    unseenNotification.push({
      message: `New Appointment Application from ${req.body.username}`,
      link: `/doctor/appointments/${docuser._id}`,
      data: {
        selectedDate: req.body.date,
        selectedTime: req.body.selectedTime,
      },
    });
    await Doctor.findByIdAndUpdate(doctor?._id, { appointments: docappoints });
    await User.findByIdAndUpdate(docuser._id, {
      unseenNotifications: unseenNotification,
    });
    res.status(200).send({ message: "Application Successful", success: true });
  } catch (error) {
    console.error("Error in /apply-appointment route:", error);
    res.status(500).send({
      message: "Error in Applying Appointment",
      success: false,
      error,
    });
  }
});

module.exports = router;
