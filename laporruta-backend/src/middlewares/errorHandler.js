const ResponseHelper = require("../utils/ResponseHelper");

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // PostgreSQL unique violation (duplicate entry)
  if (err.code === "23505") {
    return ResponseHelper.error(
      res,
      "Data sudah ada",
      409,
      err.detail || "Duplicate entry",
    );
  }

  // PostgreSQL foreign key violation
  if (err.code === "23503") {
    return ResponseHelper.error(
      res,
      "Data referensi tidak ditemukan",
      400,
      err.detail,
    );
  }

  // Custom validation error (dari Joi/Zod/manual)
  if (err.name === "ValidationError" || err.statusCode === 400) {
    return ResponseHelper.error(
      res,
      err.message || "Validasi gagal",
      400,
      err.error || err.message,
    );
  }

  // Not found
  if (err.statusCode === 404) {
    return ResponseHelper.error(
      res,
      err.message || "Data tidak ditemukan",
      404,
    );
  }

  // Unauthorized
  if (err.statusCode === 401) {
    return ResponseHelper.error(
      res,
      err.message || "Tidak terautentikasi",
      401,
    );
  }

  // Forbidden
  if (err.statusCode === 403) {
    return ResponseHelper.error(res, err.message || "Akses ditolak", 403);
  }

  // Conflict
  if (err.statusCode === 409) {
    return ResponseHelper.error(res, err.message || "Konflik data", 409);
  }

  // Default: 500 Internal Server Error
  const isDev = process.env.NODE_ENV === "development";
  return ResponseHelper.error(
    res,
    isDev ? err.message : "Terjadi kesalahan pada server",
    500,
    isDev ? err.stack : null,
  );
};

module.exports = errorHandler;
