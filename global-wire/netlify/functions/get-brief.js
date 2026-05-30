const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const id = params.id;

  if (!id) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "error", error: "Falta el identificador." }),
    };
  }

  try {
    const store = getStore("briefs");
    const result = await store.get(id, { type: "json" });

    if (!result) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "error", error: err.message }),
    };
  }
};
