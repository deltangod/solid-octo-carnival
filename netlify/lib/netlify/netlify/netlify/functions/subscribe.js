const { json, configured, sb, clean, isEmail } = require("../lib/common");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!configured()) return json(503, { error: "Not configured" });
  let d;
  try { d = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid request." }); }
  const email = clean(d.email, 254).toLowerCase();
  if (!isEmail(email)) return json(400, { error: "Please enter a valid email." });
  try {
    await sb("newsletter_subscribers?on_conflict=email", { method: "POST", body: { email }, prefer: "resolution=ignore-duplicates,return=minimal" });
    return json(200, { ok: true });
  } catch (err) {
    console.error("subscribe failed", err.message, err.detail);
    return json(500, { error: "Could not subscribe right now." });
  }
};
