const { json, configured, sb, getUserId, clean, isEmail } = require("../lib/common");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!configured()) return json(503, { error: "Not configured" });
  let d;
  try { d = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid request." }); }

  const row = {
    customer_name: clean(d.name, 120), email: clean(d.email, 254).toLowerCase(),
    garment: clean(d.garment, 80), size: clean(d.size, 40),
    measurements: clean(d.measurements, 1500) || null, description: clean(d.description, 3000),
    reference_url: clean(d.reference_url, 500) || null, destination: clean(d.destination, 160)
  };
  if (!row.customer_name || !isEmail(row.email) || !row.garment || !row.size || !row.description || !row.destination) {
    return json(400, { error: "Please complete all required fields." });
  }
  if (row.reference_url && !/^https?:\/\//i.test(row.reference_url)) row.reference_url = null;

  try {
    row.user_id = await getUserId(event);
    await sb("custom_orders", { method: "POST", body: { ...row, status: "quote_needed" }, prefer: "return=minimal" });
    return json(200, { ok: true });
  } catch (err) {
    console.error("custom order failed", err.message, err.detail);
    return json(500, { error: "Could not save your request." });
  }
};
