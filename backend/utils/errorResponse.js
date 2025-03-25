// utils/errorResponse.js
export const formatError = (message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message: message,
  };

  // Only add errors array if it exists
  if (errors) {
    response.errors = Array.isArray(errors) ? errors : [errors];
  }

  return response;
};

// Format success responses for consistency
export const formatSuccess = (data, message = "Success") => {
  return {
    success: true,
    message,
    data,
  };
};
