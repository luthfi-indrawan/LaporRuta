class ResponseHelper {
  static success(res, result, message = "successfully", statusCode = 200) {
    return res.status(statusCode).json({
      code: statusCode,
      message: message,
      result: result,
    });
  }

  static error(
    res,
    message = "Terjadi kesalahan",
    statusCode = 500,
    error = null,
  ) {
    const response = {
      code: statusCode,
      message: message,
    };
    if (error !== null) {
      response.error = error;
    }
    return res.status(statusCode).json(response);
  }

  static paginated(res, data, metadata, message = "successfully") {
    return res.status(200).json({
      code: 200,
      message: message,
      result: {
        data: data,
        metadata: metadata,
      },
    });
  }
}

module.exports = ResponseHelper;
