function handleGeminiError(error, res) {
  console.error("Gemini API error:", error);

  const status = Number(error?.status || error?.code);
  let message = "Gemini request failed.";

  if (status === 400) {
    message = "Gemini rejected the request. Check the request configuration.";
  } else if (status === 401 || status === 403) {
    message = "Gemini authentication or permission error.";
  } else if (status === 404) {
    message = "Gemini model or API resource was not found.";
  } else if (status === 429) {
    message = "Gemini quota or rate limit reached.";
  } else if (["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT"].includes(error?.code)) {
    message = "Could not connect to Gemini. Check your network.";
  }

  const response = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV !== "production") {
    Object.assign(response, {
      errorName: error?.name || "UnknownError",
      errorMessage: error?.message || "No detailed error message available",
      errorStatus: error?.status || null,
      errorCode: error?.code || null,
    });
  }

  return res.status(502).json(response);
}

function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: "API route not found.",
  });
}

function errorMiddleware(error, req, res, next) {
  console.error("Server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
}

module.exports = { handleGeminiError, notFoundHandler, errorMiddleware };
