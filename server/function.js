import serverless from "serverless-http";
import app from "./app.js";
import connectDB from "./config/db.js";

const expressHandler = serverless(app);

const getQueryParameters = (url) => {
  const parameters = {};
  const queryStart = url.indexOf("?");
  if (queryStart === -1) return parameters;

  for (const [key, value] of new URLSearchParams(url.slice(queryStart + 1))) {
    parameters[key] = value;
  }

  return parameters;
};

// Appwrite invokes this function for every HTTP request. The existing Express
// routes and MongoDB models are reused through serverless-http.
export default async ({ req, res, error }) => {
  try {
    await connectDB();

    const response = await expressHandler({
      httpMethod: req.method,
      path: req.path || req.url.split("?")[0],
      headers: req.headers || {},
      queryStringParameters: req.query || getQueryParameters(req.url),
      body: req.bodyText || undefined,
      isBase64Encoded: false,
      requestContext: {},
    }, {});

    return res.text(
      response.body || "",
      response.statusCode || 200,
      response.headers || {}
    );
  } catch (caughtError) {
    error(`API execution failed: ${caughtError.message}`);
    return res.json(
      { success: false, message: "Internal server error" },
      500
    );
  }
};
