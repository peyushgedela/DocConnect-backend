const mongoose = require("mongoose");

const docSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    fname: {
      type: String,
      required: true,
    },
    lname: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    website: {
      type: String,
    },
    address: {
      type: String,
    },
    department: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    fee: {
      type: Number,
      required: true,
    },
    fromTime: {
      type: String,
      required: true,
    },
    toTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },
    appointments: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const docModel = mongoose.model("doctors", docSchema);

module.exports = docModel;
