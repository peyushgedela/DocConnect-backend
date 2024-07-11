const express = require("express");

const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const docRoute = require("./routes/docRoute");
const dbconfig = require("./config/dbconfig");
app.use(express.json());
app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/doctor", docRoute);

app.listen(port, () => console.log(`Node running on ${port}`));
