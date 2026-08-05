const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const err = new Error("Akses token tidak ditemukan");
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      error.statusCode = 401;
      error.message = "Token sudah kadaluarsa";
    } else if (error.name === "JsonWebTokenError") {
      error.statusCode = 401;
      error.message = "Token tidak valid";
    }
    next(error);
  }
};

module.exports = authMiddleware;
