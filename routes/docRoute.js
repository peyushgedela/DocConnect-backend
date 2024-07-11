const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/docModel");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/get-doc-by-id", authMiddleware, async (req, res) => {
  try {
    const doc = await Doctor.findOne({ userId: req.body.userId });
    if (!doc) {
      return res
        .status(404)
        .send({ message: "Doctor not found", success: false });
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

router.post("/update-doctor", authMiddleware, async (req, res) => {
  try {
    const doc = await Doctor.findOneAndUpdate(
      { userId: req.body.userId },
      req.body
    );
    if (!doc) {
      return res
        .status(404)
        .send({ message: "Doctor not found", success: false });
    } else {
      res.status(200).send({
        message: "Success doctor updated",
        success: true,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error in updating", success: false });
  }
});

router.get("/get-all-appointments", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.query.doctorId);
    if (!doctor || doctor.appointments.length === 0) {
      return res.status(200).send({
        message: "No appointments found",
        success: true,
        data: [],
      });
    }
    res.status(200).send({
      message: "Appointments loaded",
      success: true,
      data: doctor.appointments,
    });
  } catch (error) {
    console.error("Error in loading appointments:", error);
    res.status(500).send({
      message: "Error in loading appointments",
      success: false,
      error: error.message,
    });
  }
});

router.post("/approve-appointment", authMiddleware, async (req, res) => {
  try {
    const { doctorId, status, userId, doctorname } = req.body;
    const user = await User.findById(userId);
    const doctor = await Doctor.findById(doctorId);

    if (!user || !doctor) {
      return res.status(404).send({
        message: "User or Doctor not found",
        success: false,
      });
    }

    // Update the user's appointment status
    const userAppointments = user.appointments;
    const userAppointment = userAppointments.find(
      (appointment) => appointment.doctorId === doctorId
    );

    if (userAppointment) {
      userAppointment.status = status;
      await User.findByIdAndUpdate(user._id, {
        appointments: userAppointments,
      });
    } else {
      return res.status(404).send({
        message: "Appointment not found in user's appointments",
        success: false,
      });
    }

    // Update the doctor's appointment status
    const doctorAppointments = doctor.appointments;
    const doctorAppointment = doctorAppointments.find(
      (appointment) => appointment.userId === userId
    );

    if (doctorAppointment) {
      doctorAppointment.status = status;
      await Doctor.findByIdAndUpdate(doctor._id, {
        appointments: doctorAppointments,
      });
    } else {
      return res.status(404).send({
        message: "Appointment not found in doctor's appointments",
        success: false,
      });
    }

    // Add a notification for the user
    const unseenNotifications = user.unseenNotifications;
    unseenNotifications.push({
      message: `Your appointment with Dr. ${doctorname} has been ${status}`,
      link: `/user/appointments/${userId}`,
    });

    await User.findByIdAndUpdate(user._id, {
      unseenNotifications,
    });

    res.status(200).send({
      message: `Appointment ${status} and user notified`,
      success: true,
      data: req.body,
    });
  } catch (error) {
    console.error("Error in /approve-appointment route:", error);
    res.status(500).send({
      message: "Error in Approving Appointment",
      success: false,
      error,
    });
  }
});

module.exports = router;
