const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    error = new ApiError(404, message);
  }

  // 2. Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    error = new ApiError(400, message);
  }

  // 3. Mongoose Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error"
  });
};

module.exports = errorHandler;
