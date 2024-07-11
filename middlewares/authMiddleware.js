const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers["authorization"];

    if (!authorizationHeader) {
      return res
        .status(401)
        .send({ message: "No token provided", success: false });
    }

    const token = authorizationHeader.split(" ")[1];

    if (!token) {
      return res
        .status(402)
        .send({ message: "No token provided", success: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Set userId directly on req
    next();
  } catch (error) {
    console.log(error);
    return res.status(403).send({ message: "Unauthorized", success: false });
  }
};
