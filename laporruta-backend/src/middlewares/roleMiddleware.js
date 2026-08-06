module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        const err = new Error("Unauthorized");
        err.statusCode = 401;
        throw err;
      }

      if (!allowedRoles.includes(req.user.role)) {
        const err = new Error("Anda tidak memiliki akses");
        err.statusCode = 403;
        throw err;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
