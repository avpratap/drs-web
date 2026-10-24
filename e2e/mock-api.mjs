// Stateful stand-in for the FastAPI backend so e2e runs without Postgres/Redis.
// Shapes follow openapi/openapi.json; only what the dashboard uses is implemented.
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 8787);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (role = "admin") =>
  `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "1", role, type: "access", ver: 0, exp: 4102444800 })}.mock`;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const iso = (d = new Date()) => d.toISOString();

function seed() {
  const db = {
    seq: 1000,
    products: [
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
        is_subscribable: true,
        perishable: true,
        avg_rating: 4.6,
        rating_count: 120,
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
        is_subscribable: true,
        perishable: true,
        avg_rating: 4.4,
        rating_count: 40,
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
        is_subscribable: false,
        perishable: false,
        avg_rating: 4.9,
        rating_count: 210,
      },
      {
        id: 4,
        sku: "PANEER-OLD",
        name: "Malai Paneer (old pack)",
        uom: "g",
        pack_size: 200,
        gst_rate: 5,
        hsn_code: "0406",
        category: "paneer",
        status: "retired",
        is_subscribable: false,
        perishable: true,
        avg_rating: 0,
        rating_count: 0,
      },
    ],
    variants: [
      {
        id: 1,
        product_id: 1,
        sku: "MILK-FC-1L",
        label: "1 L",
        pack_size: 1,
        price: 66,
        mrp: 68,
        status: "active",
        sort_order: 1,
      },
    ],
    tiers: [
      { id: 1, code: "RETAIL", name: "Retail", tier_type: "retail" },
      { id: 2, code: "HORECA", name: "Hotels & restaurants", tier_type: "b2b" },
    ],
    prices: [
      {
        id: 1,
        product_id: 1,
        price_tier_id: 1,
        unit_price: 33,
        min_qty: 1,
        valid_from: "2026-01-01",
        valid_to: null,
      },
    ],
    accounts: [
      {
        id: 1,
        owner_user_id: 11,
        account_type: "retail",
        billing_mode: "prepaid_wallet",
        price_tier_id: 1,
        phone: "9876543210",
        full_name: "Asha Verma",
      },
      {
        id: 2,
        owner_user_id: 12,
        account_type: "b2b",
        billing_mode: "postpaid_credit",
        price_tier_id: 2,
        phone: "9811111111",
        full_name: "Hotel Shree",
      },
    ],
    wallet: { 1: 450, 2: 0 },
    credit: { 1: 0, 2: 3200 },
    walletTx: {
      1: [
        { id: 1, entry_type: "topup", amount: 500, balance_after: 500, created_at: iso() },
        {
          id: 2,
          entry_type: "debit_order",
          amount: -50,
          balance_after: 450,
          ref_type: "order",
          ref_id: 7,
          created_at: iso(),
        },
      ],
      2: [],
    },
    creditLedger: {
      1: [],
      2: [
        {
          id: 1,
          entry_type: "charge",
          amount: 3200,
          balance_after: 3200,
          ref_type: "delivery",
          ref_id: 31,
          created_at: iso(),
        },
      ],
    },
    withdrawals: [
      { id: 1, account_id: 1, amount: 200, status: "requested" },
      { id: 2, account_id: 1, amount: 80, status: "paid" },
    ],
    payments: [
      {
        id: 1,
        account_id: 1,
        payment_type: "order",
        gateway: "razorpay",
        amount: 330,
        status: "success",
        ref_type: "order",
        ref_id: 7,
        gateway_order_id: "order_Mock1",
        created_at: iso(),
      },
      {
        id: 2,
        account_id: 2,
        payment_type: "wallet_topup",
        gateway: "razorpay",
        amount: 1000,
        status: "failed",
        ref_type: "wallet_topup",
        ref_id: null,
        gateway_order_id: "order_Mock2",
        created_at: iso(),
      },
    ],
    refunds: [
      {
        id: 1,
        payment_id: 1,
        account_id: 1,
        amount: 33,
        status: "pending",
        reason: "Leaking pouch",
        created_at: iso(),
      },
    ],
    locations: [
      {
        id: 1,
        name: "Jaipur plant",
        kind: "plant",
        state: "Rajasthan",
        is_default: true,
        driver_user_id: null,
        status: "active",
      },
      {
        id: 2,
        name: "Malviya Nagar hub",
        kind: "hub",
        state: "Rajasthan",
        is_default: false,
        driver_user_id: null,
        status: "active",
      },
    ],
    stock: [
      { product_id: 1, location_id: 1, qty_on_hand: 420, reorder_point: 100 },
      { product_id: 3, location_id: 1, qty_on_hand: 6, reorder_point: 20 },
    ],
    batches: [
      {
        id: 1,
        product_id: 1,
        location_id: 1,
        batch_no: "MLK-2410A",
        mfg_date: today,
        expiry_date: today,
        qty: 120,
        status: "active",
      },
      {
        id: 2,
        product_id: 3,
        location_id: 1,
        batch_no: "GHE-2409",
        mfg_date: "2026-09-01",
        expiry_date: "2027-03-01",
        qty: 6,
        status: "active",
      },
    ],
    movements: [
      { id: 1, product_id: 1, location_id: 1, change: 120, reason: "receipt", note: "Morning collection" },
    ],
    transfers: [
      {
        id: 1,
        transfer_no: "TR-0001",
        from_location_id: 1,
        to_location_id: 2,
        status: "draft",
        note: null,
        items: [{ product_id: 1, qty: 40 }],
      },
    ],
    suppliers: [
      { id: 1, name: "Gwala Dairy Co-op", gstin: "08ABCDE1234F1Z5", state: "Rajasthan", status: "active" },
    ],
    pos: [],
    boms: [
      {
        id: 1,
        product_id: 2,
        name: "Masala chaas",
        output_qty: 100,
        status: "active",
        components: [{ component_product_id: 1, qty: 40 }],
      },
    ],
    pros: [],
    deliveries: [
      {
        id: 31,
        delivery_date: today,
        shop_id: 2,
        origin: "subscription",
        status: "delivered",
        failure_reason: null,
        subtotal: 330,
        total: 330,
        amount_due: 0,
        shop_name: "Sharma Sweets",
        address: "MI Road",
        pincode: "302001",
        contact_name: "Mr Sharma",
        contact_phone: "9811111111",
        items: [
          {
            product_id: 1,
            qty_planned: 10,
            qty_delivered: 10,
            unit_price: 33,
            line_total: 330,
            status: "delivered",
          },
        ],
      },
      {
        id: 32,
        delivery_date: today,
        shop_id: 3,
        origin: "subscription",
        status: "frozen",
        failure_reason: null,
        subtotal: 66,
        total: 66,
        amount_due: 66,
        shop_name: "Verma residence",
        address: "C-Scheme",
        pincode: "302001",
        contact_name: "Asha Verma",
        contact_phone: "9876543210",
        items: [
          {
            product_id: 1,
            qty_planned: 2,
            qty_delivered: 0,
            unit_price: 33,
            line_total: 0,
            status: "planned",
          },
        ],
      },
    ],
    pods: {
      31: [
        {
          id: 1,
          delivered_by: 3,
          recipient_name: "Mr Sharma",
          photo_url: null,
          signature_url: null,
          lat: 26.9124,
          lng: 75.7873,
          note: "Handed to counter",
          captured_at: iso(),
        },
      ],
    },
    cash: {
      31: [
        {
          id: 1,
          amount_collected: 330,
          method: "upi",
          reference: "UPI-88213",
          collected_by: 3,
          collected_at: iso(),
        },
      ],
    },
    orders: [
      {
        id: 7,
        order_no: "ORD-0007",
        account_id: 1,
        shop_id: 1,
        status: "created",
        payment_status: "paid",
        total: 330,
      },
    ],
    banners: [
      {
        id: 1,
        title: "Monsoon ghee offer",
        image_url: "https://images.example/banner.jpg",
        cta_link: "/products/3",
        position: 0,
        active: true,
        valid_from: null,
        valid_to: null,
      },
    ],
    articles: [
      {
        id: 1,
        slug: "why-a2-milk",
        title: "Why A2 milk",
        body_html: "<p>…</p>",
        status: "draft",
        excerpt: null,
        author_name: "DRS",
        category: "milk",
        tags: ["a2"],
        published_at: null,
      },
    ],
    pages: [
      {
        id: 1,
        slug: "about-us",
        title: "About us",
        body_html: "<p>…</p>",
        status: "published",
        published_at: iso(),
      },
    ],
    subscribers: [{ id: 1, email: "asha@example.in", name: "Asha", status: "subscribed" }],
    tickets: [
      {
        id: 1,
        ticket_no: "T-0001",
        subject: "Milk was sour",
        category: "product",
        status: "open",
        priority: "high",
        messages: [{ id: 1, sender_role: "customer", body: "The 500 ml pouch was sour this morning." }],
      },
    ],
    ratings: [
      {
        id: 1,
        product_id: 3,
        user_id: 11,
        stars: 5,
        comment: "Best ghee in Jaipur.",
        status: "pending",
        verified_purchase: true,
        helpful_count: 3,
        admin_reply: null,
      },
    ],
    coupons: [
      {
        id: 1,
        code: "WELCOME50",
        discount_type: "flat",
        value: 50,
        min_order_value: 300,
        max_discount: null,
        valid_from: null,
        valid_to: null,
        usage_limit: 1000,
        used_count: 112,
        per_user_limit: 1,
        active: true,
      },
    ],
    audit: [
      {
        id: 1,
        admin_user_id: 1,
        action: "POST /api/v1/admin/coupons",
        resource_type: "coupon",
        resource_id: "1",
        ip: "10.0.0.4",
        detail: { code: "WELCOME50" },
        created_at: iso(),
      },
    ],
    flags: [
      { key: "checkout.upi_intent", enabled: false, description: "UPI intent flow at checkout" },
      { key: "b2b.credit", enabled: true, description: "Postpaid credit for B2B" },
    ],
  };
  return db;
}

let db = seed();
const id = () => ++db.seq;

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(status === 204 ? undefined : JSON.stringify(body));
};
const page = (res, rows, q) => {
  const limit = Number(q.get("limit") ?? 50);
  const offset = Number(q.get("offset") ?? 0);
  send(res, 200, rows.slice(offset, offset + limit), { "x-total-count": String(rows.length) });
};
const byStatus = (rows, q, key = "status_filter") =>
  q.get(key) ? rows.filter((r) => r.status === q.get(key)) : rows;
const find = (rows, rid) => rows.find((r) => r.id === Number(rid));

const routes = [];
const on = (method, pattern, fn) =>
  routes.push({ method, re: new RegExp(`^${pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)")}$`), fn });

// --- auth ---
on("POST", "/api/v1/auth/otp/request", (req, res) =>
  send(res, 200, { detail: "OTP sent", dev_otp: "123456" }),
);
on("POST", "/api/v1/auth/otp/verify", (req, res, { body }) =>
  body.otp !== "123456"
    ? send(res, 401, { detail: "Invalid or expired OTP" })
    : send(res, 200, {
        access_token: token(body.phone === "9000000000" ? "customer" : "admin"),
        refresh_token: `rt-${id()}`,
        token_type: "bearer",
      }),
);
on("POST", "/api/v1/auth/refresh", (req, res) =>
  send(res, 200, { access_token: token(), refresh_token: `rt-${id()}`, token_type: "bearer" }),
);
on("POST", "/api/v1/auth/logout", (req, res) => send(res, 200, { detail: "logged out" }));
on("GET", "/api/v1/auth/me", (req, res) =>
  send(res, 200, { id: 1, phone: "9876500001", role: "admin", full_name: "Asha Admin", status: "active" }),
);

// --- test control ---
on("POST", "/__reset", (req, res) => {
  db = seed();
  send(res, 200, { ok: true });
});

// --- catalog ---
on("GET", "/api/v1/admin/products", (req, res, { q }) => {
  let rows = db.products;
  const s = q.get("status") ?? "all";
  if (s !== "all") rows = rows.filter((p) => p.status === s);
  const term = q.get("q")?.toLowerCase();
  if (term)
    rows = rows.filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
  page(
    res,
    [...rows].sort((a, b) => b.id - a.id),
    q,
  );
});
on("GET", "/api/v1/products/:pid", (req, res, { p }) =>
  find(db.products, p.pid)
    ? send(res, 200, find(db.products, p.pid))
    : send(res, 404, { detail: "Product not found" }),
);
on("POST", "/api/v1/products", (req, res, { body }) => {
  if (db.products.some((p) => p.sku === body.sku))
    return send(res, 409, { detail: "Product SKU already exists" });
  const p = {
    id: id(),
    status: "active",
    avg_rating: 0,
    rating_count: 0,
    uom: "piece",
    pack_size: 1,
    gst_rate: 0,
    ...body,
  };
  db.products.push(p);
  send(res, 200, p);
});
on("PATCH", "/api/v1/products/:pid", (req, res, { p, body }) =>
  send(res, 200, Object.assign(find(db.products, p.pid), body)),
);
on("DELETE", "/api/v1/products/:pid", (req, res, { p }) => {
  find(db.products, p.pid).status = "retired";
  send(res, 204);
});
on("GET", "/api/v1/products/:pid/variants", (req, res, { p }) =>
  send(
    res,
    200,
    db.variants.filter((v) => v.product_id === Number(p.pid)),
  ),
);
on("GET", "/api/v1/admin/price-tiers", (req, res) => send(res, 200, db.tiers));
on("GET", "/api/v1/admin/product-prices", (req, res, { q }) => page(res, db.prices, q));

// --- billing ---
const accountDetail = (a) => ({
  ...a,
  wallet_balance: db.wallet[a.id],
  credit_outstanding: db.credit[a.id],
  order_count: 3,
  subscription_count: 1,
});
on("GET", "/api/v1/admin/accounts", (req, res, { q }) => page(res, db.accounts, q));
on("GET", "/api/v1/admin/accounts/:aid", (req, res, { p }) =>
  send(res, 200, accountDetail(find(db.accounts, p.aid))),
);
on("GET", "/api/v1/admin/accounts/:aid/wallet/transactions", (req, res, { p, q }) =>
  page(res, [...db.walletTx[p.aid]].reverse(), q),
);
on("GET", "/api/v1/admin/accounts/:aid/credit/ledger", (req, res, { p, q }) =>
  page(res, [...db.creditLedger[p.aid]].reverse(), q),
);
on("POST", "/api/v1/billing/admin/topup", (req, res, { body, headers }) => {
  if (!headers["idempotency-key"]) return send(res, 400, { detail: "Idempotency-Key header required" });
  db.wallet[body.account_id] += body.amount;
  db.walletTx[body.account_id].push({
    id: id(),
    entry_type: "topup",
    amount: body.amount,
    balance_after: db.wallet[body.account_id],
    created_at: iso(),
  });
  send(res, 200, { detail: "ok", account_id: body.account_id, amount: body.amount });
});
on("POST", "/api/v1/admin/accounts/:aid/wallet/adjust", (req, res, { p, body }) => {
  db.wallet[p.aid] += body.amount;
  db.walletTx[p.aid].push({
    id: id(),
    entry_type: "adjustment",
    amount: body.amount,
    balance_after: db.wallet[p.aid],
    ref_type: body.reason,
    created_at: iso(),
  });
  send(res, 200, { account_id: Number(p.aid), wallet_balance: db.wallet[p.aid] });
});
on("POST", "/api/v1/admin/accounts/:aid/credit/settle", (req, res, { p, body }) => {
  db.credit[p.aid] -= body.amount;
  db.creditLedger[p.aid].push({
    id: id(),
    entry_type: "payment",
    amount: -body.amount,
    balance_after: db.credit[p.aid],
    created_at: iso(),
  });
  send(res, 200, { account_id: Number(p.aid), credit_outstanding: db.credit[p.aid] });
});
on("GET", "/api/v1/admin/withdrawals", (req, res, { q }) => page(res, byStatus(db.withdrawals, q), q));
on("POST", "/api/v1/admin/withdrawals/:wid/:decision", (req, res, { p }) => {
  const w = find(db.withdrawals, p.wid);
  w.status = p.decision === "approve" ? "paid" : "rejected";
  send(res, 200, { id: w.id, status: w.status });
});
on("GET", "/api/v1/admin/payments", (req, res, { q }) => page(res, byStatus(db.payments, q), q));
on("GET", "/api/v1/admin/payments/:pid", (req, res, { p }) => send(res, 200, find(db.payments, p.pid)));
on("POST", "/api/v1/payments/:pid/refund", (req, res, { p, body }) => {
  const pay = find(db.payments, p.pid);
  const r = {
    id: id(),
    payment_id: pay.id,
    account_id: pay.account_id,
    amount: body.amount ?? pay.amount,
    status: "initiated",
    reason: body.reason ?? null,
    created_at: iso(),
  };
  db.refunds.push(r);
  send(res, 200, { refund_id: r.id, payment_id: pay.id, amount: r.amount, status: r.status });
});
on("GET", "/api/v1/admin/refunds", (req, res, { q }) =>
  page(
    res,
    byStatus(db.refunds, q).filter(
      (r) => !q.get("payment_id") || r.payment_id === Number(q.get("payment_id")),
    ),
    q,
  ),
);
on("GET", "/api/v1/admin/refunds/:rid", (req, res, { p }) => send(res, 200, find(db.refunds, p.rid)));
on("POST", "/api/v1/payments/refunds/:rid/reconcile", (req, res, { p, body }) => {
  const r = find(db.refunds, p.rid);
  r.status = body.outcome;
  send(res, 200, { refund_id: r.id, payment_id: r.payment_id, amount: r.amount, status: r.status });
});

// --- inventory ---
on("GET", "/api/v1/admin/locations", (req, res, { q }) => page(res, db.locations, q));
on("POST", "/api/v1/admin/locations", (req, res, { body }) => {
  const l = { id: id(), status: "active", is_default: false, driver_user_id: null, state: null, ...body };
  db.locations.push(l);
  send(res, 200, l);
});
on("GET", "/api/v1/admin/stock", (req, res, { q }) => page(res, db.stock, q));
on("GET", "/api/v1/admin/stock/low", (req, res, { q }) =>
  page(
    res,
    db.stock.filter((s) => s.reorder_point > 0 && s.qty_on_hand <= s.reorder_point),
    q,
  ),
);
on("GET", "/api/v1/admin/stock/reorder-suggestions", (req, res, { q }) =>
  page(
    res,
    db.stock
      .filter((s) => s.reorder_point > 0 && s.qty_on_hand <= s.reorder_point)
      .map((s) => ({ ...s, suggested_qty: 2 * s.reorder_point - s.qty_on_hand })),
    q,
  ),
);
on("GET", "/api/v1/admin/stock/:pid/movements", (req, res, { p, q }) =>
  page(res, db.movements.filter((m) => m.product_id === Number(p.pid)).reverse(), q),
);
on("POST", "/api/v1/admin/stock/adjust", (req, res, { body }) => {
  const s = db.stock.find(
    (x) => x.product_id === body.product_id && x.location_id === (body.location_id ?? 1),
  );
  s.qty_on_hand += body.change;
  db.movements.push({
    id: id(),
    product_id: body.product_id,
    location_id: s.location_id,
    change: body.change,
    reason: body.reason,
    note: body.note ?? null,
  });
  send(res, 200, s);
});
on("GET", "/api/v1/admin/stock/batches", (req, res, { q }) => {
  let rows = [...db.batches].sort((a, b) => (a.expiry_date ?? "9999").localeCompare(b.expiry_date ?? "9999"));
  if (q.get("active_only") !== "false") rows = rows.filter((b) => b.status === "active" && b.qty > 0);
  if (q.get("product_id")) rows = rows.filter((b) => b.product_id === Number(q.get("product_id")));
  page(res, rows, q);
});
on("POST", "/api/v1/admin/stock/batches", (req, res, { body }) => {
  const b = { id: id(), location_id: 1, mfg_date: null, expiry_date: null, status: "active", ...body };
  db.batches.push(b);
  send(res, 200, b);
});
on("GET", "/api/v1/admin/transfers", (req, res, { q }) => page(res, byStatus(db.transfers, q), q));
on("GET", "/api/v1/admin/transfers/:tid", (req, res, { p }) => send(res, 200, find(db.transfers, p.tid)));
on("POST", "/api/v1/admin/transfers/:tid/:act", (req, res, { p }) => {
  const t = find(db.transfers, p.tid);
  t.status = { dispatch: "in_transit", receive: "received", cancel: "cancelled" }[p.act];
  send(res, 200, t);
});
on("GET", "/api/v1/admin/suppliers", (req, res, { q }) => page(res, db.suppliers, q));
on("GET", "/api/v1/admin/purchase-orders", (req, res, { q }) => page(res, byStatus(db.pos, q), q));
on("POST", "/api/v1/admin/purchase-orders", (req, res, { body }) => {
  const items = body.items.map((i) => ({
    product_id: i.product_id,
    qty_ordered: i.qty,
    qty_received: 0,
    unit_cost: i.unit_cost,
    line_total: i.qty * i.unit_cost,
  }));
  const total = items.reduce((a, i) => a + i.line_total, 0);
  const po = {
    id: id(),
    po_no: `PO-${db.seq}`,
    supplier_id: body.supplier_id,
    location_id: body.location_id ?? 1,
    status: "draft",
    expected_date: body.expected_date ?? null,
    subtotal: total,
    total,
    items,
  };
  db.pos.push(po);
  send(res, 200, po);
});
on("GET", "/api/v1/admin/purchase-orders/:poid", (req, res, { p }) => send(res, 200, find(db.pos, p.poid)));
on("POST", "/api/v1/admin/purchase-orders/:poid/place", (req, res, { p }) =>
  send(res, 200, Object.assign(find(db.pos, p.poid), { status: "placed" })),
);
on("POST", "/api/v1/admin/purchase-orders/:poid/cancel", (req, res, { p }) =>
  send(res, 200, Object.assign(find(db.pos, p.poid), { status: "cancelled" })),
);
on("POST", "/api/v1/admin/purchase-orders/:poid/receive", (req, res, { p, body, headers }) => {
  if (!headers["idempotency-key"]) return send(res, 400, { detail: "Idempotency-Key header required" });
  const po = find(db.pos, p.poid);
  for (const l of body.lines) {
    const item = po.items.find((i) => i.product_id === l.product_id);
    item.qty_received += l.qty_received;
    db.batches.push({
      id: id(),
      product_id: l.product_id,
      location_id: po.location_id,
      batch_no: l.batch_no,
      mfg_date: l.mfg_date,
      expiry_date: l.expiry_date,
      qty: l.qty_received,
      status: "active",
    });
  }
  po.status = po.items.every((i) => i.qty_received >= i.qty_ordered) ? "received" : "partially_received";
  send(res, 200, po);
});
on("GET", "/api/v1/admin/boms", (req, res, { q }) => page(res, db.boms, q));
on("GET", "/api/v1/admin/boms/:bid", (req, res, { p }) => send(res, 200, find(db.boms, p.bid)));
on("GET", "/api/v1/admin/production-orders", (req, res, { q }) => page(res, byStatus(db.pros, q), q));

// --- delivery & orders ---
on("GET", "/api/v1/delivery/orders", (req, res, { q }) =>
  page(
    res,
    db.deliveries.filter((d) => d.delivery_date === (q.get("date") ?? today)),
    q,
  ),
);
on("GET", "/api/v1/delivery/summary", (req, res, { q }) => {
  const rows = db.deliveries.filter((d) => d.delivery_date === (q.get("date") ?? today));
  send(res, 200, {
    date: q.get("date") ?? today,
    delivered: rows.filter((d) => d.status.includes("delivered") && d.status !== "not_delivered").length,
    failed: rows.filter((d) => d.status === "failed").length,
    pending: rows.filter((d) => ["generated", "frozen"].includes(d.status)).length,
    cash_collected: rows.reduce(
      (a, d) => a + (db.cash[d.id] ?? []).reduce((s, c) => s + c.amount_collected, 0),
      0,
    ),
  });
});
on("GET", "/api/v1/admin/delivery-orders/:did/fulfillment", (req, res, { p }) => {
  const o = find(db.deliveries, p.did);
  const cash = db.cash[o.id] ?? [];
  send(res, 200, {
    order: o,
    pod: db.pods[o.id] ?? [],
    cash,
    returns: [],
    cash_total: cash.reduce((a, c) => a + c.amount_collected, 0),
  });
});
on("POST", "/api/v1/delivery/orders/:did/fail", (req, res, { p, body }) =>
  send(
    res,
    200,
    Object.assign(find(db.deliveries, p.did), { status: "failed", failure_reason: body.reason }),
  ),
);
on("GET", "/api/v1/admin/orders", (req, res, { q }) => page(res, byStatus(db.orders, q), q));

// --- reports ---
on("GET", "/api/v1/admin/reports/summary", (req, res) =>
  send(res, 200, {
    paid_order_revenue: 1284500,
    wallet_float: 92000,
    credit_outstanding: 45200,
    active_subscriptions: 312,
    shops: 48,
    delivered_orders: 18240,
  }),
);
on("GET", "/api/v1/admin/analytics/overview", (req, res) =>
  send(res, 200, {
    paid_order_revenue: 1284500,
    orders: 19410,
    active_subscriptions: 312,
    delivered_orders: 18240,
    low_stock_items: 1,
    credit_outstanding: 45200,
    wallet_float: 92000,
  }),
);
on("GET", "/api/v1/admin/analytics/revenue", (req, res, { q }) => {
  const days = Number(q.get("days") ?? 30);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
    if (i % 6 === 3) continue; // a gap day
    out.push({ date, revenue: 32000 + ((i * 7919) % 18000), orders: 380 + ((i * 31) % 120) });
  }
  send(res, 200, out);
});
on("GET", "/api/v1/admin/analytics/top-products", (req, res) =>
  send(res, 200, [
    { product_id: 1, name: "Full Cream Milk", qty: 9200, revenue: 303600 },
    { product_id: 3, name: "A2 Desi Ghee", qty: 410, revenue: 266500 },
    { product_id: 2, name: "Masala Buttermilk", qty: 3100, revenue: 46500 },
  ]),
);

// --- content ---
const cms = (name, key) => {
  on("GET", `/api/v1/admin/content/${name}`, (req, res, { q }) => page(res, byStatus(db[key], q), q));
  on("GET", `/api/v1/admin/content/${name}/:cid`, (req, res, { p }) => send(res, 200, find(db[key], p.cid)));
  on("POST", `/api/v1/admin/content/${name}`, (req, res, { body }) => {
    if (body.slug && db[key].some((x) => x.slug === body.slug))
      return send(res, 409, { detail: "slug already in use" });
    const row = { id: id(), status: "draft", published_at: null, active: true, position: 0, ...body };
    db[key].push(row);
    send(res, 200, row);
  });
  on("PATCH", `/api/v1/admin/content/${name}/:cid`, (req, res, { p, body }) =>
    send(res, 200, Object.assign(find(db[key], p.cid), body)),
  );
  on("DELETE", `/api/v1/admin/content/${name}/:cid`, (req, res, { p }) => {
    db[key] = db[key].filter((x) => x.id !== Number(p.cid));
    send(res, 204);
  });
  on("POST", `/api/v1/admin/content/${name}/:cid/publish`, (req, res, { p }) =>
    send(res, 200, Object.assign(find(db[key], p.cid), { status: "published", published_at: iso() })),
  );
  on("POST", `/api/v1/admin/content/${name}/:cid/unpublish`, (req, res, { p }) =>
    send(res, 200, Object.assign(find(db[key], p.cid), { status: "draft" })),
  );
};
cms("articles", "articles");
cms("pages", "pages");
cms("banners", "banners");
on("GET", "/api/v1/admin/newsletter/subscribers", (req, res, { q }) =>
  page(res, byStatus(db.subscribers, q), q),
);

// --- customers ---
on("GET", "/api/v1/admin/support/tickets", (req, res, { q }) => page(res, byStatus(db.tickets, q), q));
on("GET", "/api/v1/admin/support/tickets/:tid", (req, res, { p }) => send(res, 200, find(db.tickets, p.tid)));
on("POST", "/api/v1/admin/support/tickets/:tid/messages", (req, res, { p, body }) => {
  const t = find(db.tickets, p.tid);
  t.messages.push({ id: id(), sender_role: "admin", body: body.body });
  send(res, 200, t);
});
on("POST", "/api/v1/admin/support/tickets/:tid/status", (req, res, { p, body }) =>
  send(res, 200, Object.assign(find(db.tickets, p.tid), { status: body.status })),
);
on("GET", "/api/v1/admin/ratings", (req, res, { q }) => page(res, byStatus(db.ratings, q), q));
on("POST", "/api/v1/admin/ratings/:rid/moderate", (req, res, { p, body }) =>
  send(res, 200, Object.assign(find(db.ratings, p.rid), { status: body.status })),
);
on("POST", "/api/v1/admin/ratings/:rid/reply", (req, res, { p, body }) =>
  send(res, 200, Object.assign(find(db.ratings, p.rid), { admin_reply: body.reply })),
);
on("GET", "/api/v1/admin/coupons", (req, res, { q }) =>
  page(res, q.get("active") ? db.coupons.filter((c) => String(c.active) === q.get("active")) : db.coupons, q),
);
on("GET", "/api/v1/admin/coupons/:cid", (req, res, { p }) => send(res, 200, find(db.coupons, p.cid)));
on("POST", "/api/v1/admin/coupons", (req, res, { body }) => {
  const c = {
    id: id(),
    used_count: 0,
    active: true,
    max_discount: null,
    valid_from: null,
    valid_to: null,
    usage_limit: null,
    per_user_limit: null,
    min_order_value: 0,
    ...body,
  };
  db.coupons.push(c);
  send(res, 200, c);
});
on("POST", "/api/v1/admin/coupons/:cid/deactivate", (req, res, { p }) =>
  send(res, 200, Object.assign(find(db.coupons, p.cid), { active: false })),
);

// --- system ---
on("GET", "/api/v1/admin/audit-log", (req, res, { q }) => page(res, db.audit, q));
on("GET", "/api/v1/admin/feature-flags", (req, res) => send(res, 200, db.flags));
on("PUT", "/api/v1/admin/feature-flags", (req, res, { body }) => {
  const f = db.flags.find((x) => x.key === body.key);
  if (f) Object.assign(f, body);
  else db.flags.push({ description: null, ...body });
  send(
    res,
    200,
    db.flags.find((x) => x.key === body.key),
  );
});

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return send(res, 422, { detail: "bad json" });
  }
  const isAuth = url.pathname.startsWith("/api/v1/auth/") && url.pathname !== "/api/v1/auth/me";
  if (!isAuth && url.pathname !== "/__reset" && !req.headers.authorization?.startsWith("Bearer "))
    return send(res, 401, { detail: "Not authenticated" });
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = r.re.exec(url.pathname);
    if (!m) continue;
    try {
      return r.fn(req, res, { p: m.groups ?? {}, q: url.searchParams, body, headers: req.headers });
    } catch (e) {
      return send(res, 500, { detail: String(e) });
    }
  }
  send(res, 404, { detail: `mock: no route for ${req.method} ${url.pathname}` });
}).listen(PORT, () => console.log(`mock api on :${PORT}`));
