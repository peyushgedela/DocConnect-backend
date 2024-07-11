const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const docRoute = require("./routes/docRoute");
const dbconfig = require("./config/dbconfig");
app.use(cors());
app.use(express.json());
app.use("/api/user", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/doctor", docRoute);

const path = require("path");
__dirname = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dev")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "dev", "index.html"));
  });
}

app.listen(port, () => console.log(`Node running on ${port}`));
