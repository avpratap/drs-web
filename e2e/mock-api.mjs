// Minimal stand-in for the FastAPI backend so the smoke test runs without a DB.
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 8787);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (type) =>
  `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "1", role: "admin", type, ver: 0, exp: 4102444800 })}.mock`;

const products = [
  {
    id: 1,
    sku: "MILK-FC-500",
    name: "Full Cream Milk",
    uom: "ml",
    pack_size: 500,
    gst_rate: 0,
    hsn_code: "0401",
    category: "milk",
    status: "active",
  },
  {
    id: 2,
    sku: "BTRMLK-200",
    name: "Masala Buttermilk",
    uom: "ml",
    pack_size: 200,
    gst_rate: 5,
    hsn_code: "0403",
    category: "buttermilk",
    status: "active",
  },
  {
    id: 3,
    sku: "GHEE-1L",
    name: "A2 Desi Ghee",
    uom: "litre",
    pack_size: 1,
    gst_rate: 12,
    hsn_code: "0405",
    category: "ghee",
    status: "active",
  },
];

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const authed = req.headers.authorization?.startsWith("Bearer ");
  let body = "";
  for await (const chunk of req) body += chunk;

  if (req.method === "POST" && url.pathname === "/api/v1/auth/otp/request")
    return json(res, 200, { detail: "OTP sent", dev_otp: "123456" });
  if (req.method === "POST" && url.pathname === "/api/v1/auth/otp/verify") {
    const { otp } = JSON.parse(body || "{}");
    if (otp !== "123456") return json(res, 401, { detail: "Invalid or expired OTP" });
    return json(res, 200, { access_token: token("access"), refresh_token: "rt-1", token_type: "bearer" });
  }
  if (req.method === "POST" && url.pathname === "/api/v1/auth/refresh")
    return json(res, 200, { access_token: token("access"), refresh_token: "rt-2", token_type: "bearer" });
  if (req.method === "POST" && url.pathname === "/api/v1/auth/logout")
    return json(res, 200, { detail: "logged out" });

  if (!authed) return json(res, 401, { detail: "Not authenticated" });
  if (url.pathname === "/api/v1/auth/me")
    return json(res, 200, {
      id: 1,
      phone: "9876543210",
      role: "admin",
      full_name: "Asha Admin",
      status: "active",
    });
  if (url.pathname === "/api/v1/products") {
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const q = url.searchParams.get("q")?.toLowerCase();
    const rows = q
      ? products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      : products;
    return json(res, 200, rows.slice(offset, offset + limit));
  }
  if (url.pathname === "/api/v1/admin/price-tiers") return json(res, 200, []);
  return json(res, 404, { detail: "Not found" });
}).listen(PORT, () => console.log(`mock api on :${PORT}`));
