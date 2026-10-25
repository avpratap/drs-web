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
        // A product photo from the media store; ghee's points at a missing file (fallback art).
        image_url: "/files/media/products/milk.svg",
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
        image_url: "/files/media/products/ghee-missing.jpg",
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
      {
        id: 5,
        sku: "CURD-FRESH-400",
        name: "Farm Fresh Curd",
        description: "Thick, set overnight in small batches.",
        uom: "g",
        pack_size: 400,
        gst_rate: 5,
        hsn_code: "0403",
        category: "curd",
        status: "active",
        is_subscribable: false,
        perishable: true,
        avg_rating: 0,
        rating_count: 0,
      },
    ],
    variants: [
      // selling_price = RETAIL unit price x pack_size, GST-inclusive (what the cart charges):
      // linear in pack size, like the backend (milk ₹0.066/ml, buttermilk ₹0.075/ml, ghee ₹899/L).
      {
        id: 1,
        product_id: 1,
        sku: "MILK-FC-1L",
        label: "1 L",
        pack_size: 1000,
        price: 66,
        mrp: 68,
        selling_price: 66,
        status: "active",
        sort_order: 2,
      },
      {
        id: 2,
        product_id: 1,
        sku: "MILK-FC-500",
        label: "500 ml",
        pack_size: 500,
        price: 33,
        mrp: 34,
        selling_price: 33,
        status: "active",
        sort_order: 1,
      },
      {
        id: 3,
        product_id: 2,
        sku: "BTRMLK-200",
        label: "200 ml",
        pack_size: 200,
        price: 15,
        mrp: 20,
        selling_price: 15,
        status: "active",
        sort_order: 1,
      },
      {
        id: 4,
        product_id: 2,
        sku: "BTRMLK-1200",
        label: "Pack of 6 (1.2 L)",
        pack_size: 1200,
        price: 84,
        mrp: 120,
        selling_price: null,
        status: "active",
        sort_order: 2,
      },
      {
        id: 5,
        product_id: 3,
        sku: "GHEE-500",
        label: "500 ml",
        pack_size: 0.5,
        price: 449.5,
        mrp: null,
        selling_price: 449.5,
        status: "active",
        sort_order: 1,
      },
      {
        id: 6,
        product_id: 3,
        sku: "GHEE-1L",
        label: "1 L",
        pack_size: 1,
        price: 899,
        mrp: 999,
        selling_price: 899,
        status: "active",
        sort_order: 2,
      },
    ],
    // Approved storefront reviews (public), kept apart from the admin moderation queue.
    reviews: [
      {
        id: 101,
        product_id: 3,
        stars: 5,
        comment: "Grainy, aromatic — tastes like home.",
        verified_purchase: true,
        helpful_count: 12,
      },
      {
        id: 102,
        product_id: 3,
        stars: 4,
        comment: "Lovely ghee, a little pricey.",
        verified_purchase: true,
        helpful_count: 4,
      },
      {
        id: 104,
        product_id: 2,
        stars: 4,
        comment: "Perfectly spiced, great after lunch.",
        verified_purchase: false,
        helpful_count: 0,
      },
      {
        id: 103,
        product_id: 1,
        stars: 5,
        comment: "Fresh every single morning.",
        verified_purchase: true,
        helpful_count: 7,
      },
    ],
    carts: {},
    // Published storefront content (kept apart from the admin CMS fixtures above).
    publicContent: {
      articles: [
        {
          id: 201,
          slug: "a2-milk-explained",
          title: "A2 milk, explained",
          body_html:
            '<p>Most milk contains two kinds of beta-casein protein. <strong>A2 milk</strong> comes from cows that make only the A2 kind.</p><h2>Why some people prefer it</h2><ul><li>Many find it gentler to digest</li><li>It tastes just like the milk you know</li></ul><p>Read the <a href="https://example.org/a2-study">research summary</a>.</p><script>alert("xss")</script><p onclick="steal()">Fresh every morning.</p>',
          excerpt: "What makes A2 milk different, and why many families switch to it.",
          author_name: "DRS Kitchen",
          category: "nutrition",
          tags: ["a2", "milk"],
          status: "published",
          meta_title: "A2 milk, explained | DRS Journal",
          meta_description: "What A2 milk is and why many families prefer it.",
          cover_image_url: null,
          published_at: "2026-10-20T06:00:00Z",
        },
        {
          id: 202,
          slug: "how-we-make-bilona-ghee",
          title: "How we make bilona ghee",
          body_html:
            "<p>Curd is churned by hand, the butter slow-cooked until it turns golden and grainy.</p><h2>Slow is the point</h2><p>It takes about 25 litres of milk to make one litre of ghee.</p>",
          excerpt: "Curd, churning and patience: the slow way to golden ghee.",
          author_name: "DRS Kitchen",
          category: "kitchen",
          tags: ["ghee"],
          status: "published",
          meta_title: null,
          meta_description: null,
          cover_image_url: "/files/content/ghee-cover.svg",
          published_at: "2026-10-12T06:00:00Z",
        },
      ],
      pages: [
        {
          id: 301,
          slug: "faq",
          title: "Frequently asked questions",
          body_html:
            "<h2>When do you deliver?</h2><p>Every morning before 7 am.</p><h2>Can I pause my subscription?</h2><p>Yes — pause or skip any day from your account before the nightly cut-off.</p>",
          status: "published",
          meta_title: "FAQs",
          meta_description: "Deliveries, subscriptions and payments — answered.",
          published_at: "2026-10-01T06:00:00Z",
        },
        {
          id: 302,
          slug: "terms",
          title: "Terms of service",
          body_html: "<p>These terms govern your use of DRS Dairy.</p>",
          status: "published",
          meta_title: null,
          meta_description: null,
          published_at: "2026-10-01T06:00:00Z",
        },
      ],
      banners: [
        {
          id: 401,
          title: "Ghee week: 10% off A2 ghee",
          image_url: "/files/content/ghee-banner.svg",
          cta_link: "/products?category=ghee",
          position: 1,
          active: true,
          valid_from: null,
          valid_to: null,
        },
        {
          id: 402,
          title: "Try A2 milk for 7 days",
          image_url: "/files/content/milk-banner.svg",
          cta_link: "/products?category=milk",
          position: 2,
          active: true,
          valid_from: null,
          valid_to: null,
        },
      ],
    },
    // The storefront customer (phone 9000000000): profile, wallet and one delivered order.
    custProfile: {
      user_id: 50,
      phone: "9000000000",
      email: null,
      email_verified: false,
      full_name: "Asha Verma",
      display_name: null,
      avatar_url: null,
      date_of_birth: null,
      gender: null,
      locale: "en-IN",
      alternate_phone: null,
      gstin: null,
      legal_name: null,
      notify_whatsapp: true,
      notify_sms: true,
      notify_push: true,
      notify_email: false,
      marketing_opt_in: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
    },
    custLoyalty: {
      balance: 120,
      ledger: [
        { delta: 50, reason: "order", balance_after: 120 },
        { delta: -30, reason: "redeem", balance_after: 70 },
        { delta: 100, reason: "referral", balance_after: 100 },
      ],
      referral: { code: "ASHA2026", reward_points: 100, status: "active" },
      redeemedReferral: false,
    },
    custGiftCards: [
      {
        code: "DRSGIFT500",
        initial_amount: 500,
        balance: 300,
        status: "active",
        expires_at: "2027-03-31",
        mine: true,
      },
      {
        code: "WELCOME250",
        initial_amount: 250,
        balance: 250,
        status: "active",
        expires_at: null,
        mine: false,
      },
    ],
    custWishlist: [3],
    custTickets: [
      {
        id: 40,
        ticket_no: "TKT-000040",
        subject: "Paneer was delivered late",
        category: "delivery",
        status: "pending",
        priority: "normal",
        messages: [
          {
            id: 1,
            sender_role: "customer",
            body: "My paneer came at 9 am instead of 7.",
            attachment_url: null,
          },
          {
            id: 2,
            sender_role: "agent",
            body: "Sorry about that! We've spoken to the route team.",
            attachment_url: null,
          },
        ],
      },
    ],
    custNotifications: [
      {
        id: 71,
        event_type: "order_delivered",
        channel: "push",
        category: "order",
        body: "Your order DRS-000880 was delivered.",
        status: "sent",
        created_at: "2026-10-24T02:10:00Z",
        read_at: null,
      },
      {
        id: 72,
        event_type: "wallet_low",
        channel: "push",
        category: "billing",
        body: "Your wallet is below ₹300. Top up to keep deliveries coming.",
        status: "sent",
        created_at: "2026-10-23T08:00:00Z",
        read_at: null,
      },
      {
        id: 73,
        event_type: "offer",
        channel: "push",
        category: "marketing",
        body: "Ghee week: 10% off A2 ghee.",
        status: "sent",
        created_at: "2026-10-20T06:00:00Z",
        read_at: "2026-10-20T07:00:00Z",
      },
    ],
    custConsents: {
      data_processing: "granted",
      whatsapp_optin: "granted",
      marketing_sms: "withdrawn",
      marketing_email: "withdrawn",
      marketing_push: "granted",
      marketing_whatsapp: "withdrawn",
    },
    custErased: false,
    custWallet: {
      balance: 250,
      txns: Array.from({ length: 23 }, (_, i) => ({
        id: 500 + i,
        txn_type: i % 4 === 0 ? "topup" : "debit",
        amount: i % 4 === 0 ? 500 : 33,
        balance_after: 250 + i * 10,
        ref_type: i % 4 === 0 ? "payment" : "order",
        ref_id: 900 + i,
        created_at: new Date(Date.UTC(2026, 9, 24) - i * 86_400_000).toISOString(),
      })),
    },
    addresses: [],
    idem: {}, // Idempotency-Key -> stored response (checkout / payment create)
    onlinePayments: [],
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
        id: 880,
        order_no: "DRS-000880",
        account_id: 50,
        shop_id: 1,
        order_type: "one_time",
        status: "delivered",
        payment_status: "paid",
        subtotal: 132,
        discount: 0,
        coupon_code: null,
        total: 132,
        tax_total: 0,
        total_incl_tax: 132,
        items: [
          {
            product_id: 1,
            qty: 2000,
            unit_price: 0.066,
            line_total: 132,
            gst_rate: 0,
            gst_amount: 0,
            price_incl_tax: 0.066,
          },
        ],
        owner: `Bearer ${token("customer")}`,
        shipments: [
          {
            id: 1,
            shipment_no: "SH-880",
            status: "delivered",
            courier: "DRS Fleet",
            awb: "AWB880",
            tracking_url: null,
            events: [
              { status: "delivered", location: "Jaipur", note: "Left at the door", event_time: null },
              { status: "out_for_delivery", location: "Jaipur hub", note: null, event_time: null },
            ],
          },
        ],
      },
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
    rmas: [
      {
        id: 1,
        rma_no: "RMA-0001",
        order_id: 7,
        account_id: 1,
        status: "requested",
        reason: "Pouch leaked",
        resolution: null,
        refund_amount: 0,
        items: [{ product_id: 1, qty: 2, reason: "leaking" }],
        created_at: iso(),
      },
      {
        id: 2,
        rma_no: "RMA-0002",
        order_id: 7,
        account_id: 1,
        status: "approved",
        reason: "Sour",
        resolution: null,
        refund_amount: 0,
        items: [{ product_id: 1, qty: 1, reason: "sour" }],
        created_at: iso(),
      },
    ],
    shops: [
      {
        id: 2,
        account_id: 2,
        name: "Sharma Sweets",
        address: "MI Road",
        state: "Rajasthan",
        pincode: "302001",
        status: "active",
        price_tier_id: 2,
        is_home: false,
      },
      {
        id: 3,
        account_id: 1,
        name: "Verma residence",
        address: "C-Scheme",
        state: "Rajasthan",
        pincode: "302001",
        status: "active",
        price_tier_id: null,
        is_home: true,
      },
    ],
    users: [
      { id: 1, phone: "9876500001", full_name: "Asha Admin", email: null, role: "admin", status: "active" },
      {
        id: 11,
        phone: "9876543210",
        full_name: "Asha Verma",
        email: "asha@example.in",
        role: "customer",
        status: "active",
      },
      {
        id: 12,
        phone: "9811111111",
        full_name: "Hotel Shree",
        email: null,
        role: "subscriber",
        status: "active",
      },
      {
        id: 21,
        phone: "9999900003",
        full_name: "Ramesh (driver)",
        email: null,
        role: "delivery",
        status: "active",
      },
      {
        id: 22,
        phone: "9999900004",
        full_name: "Suresh (driver)",
        email: null,
        role: "delivery",
        status: "active",
      },
    ],
    assignments: [{ id: 1, delivery_id: 21, shop_id: 2, active: true }],
    subs: [
      {
        id: 1,
        shop_id: 2,
        account_id: 2,
        status: "active",
        start_date: "2026-09-01",
        end_date: null,
        created_at: iso(),
        items: [
          {
            id: 1,
            product_id: 1,
            default_qty: 10,
            frequency: "daily",
            interval_days: null,
            days_of_week: null,
            active: true,
          },
        ],
      },
      {
        id: 2,
        shop_id: 3,
        account_id: 1,
        status: "paused",
        start_date: "2026-09-15",
        end_date: null,
        created_at: iso(),
        items: [
          {
            id: 2,
            product_id: 2,
            default_qty: 2,
            frequency: "alternate",
            interval_days: 2,
            days_of_week: null,
            active: true,
          },
        ],
      },
    ],
    cutoffRuns: [
      {
        id: 1,
        for_delivery_date: today,
        status: "frozen",
        orders_generated: 2,
        started_at: iso(new Date(Date.now() - 12 * 3600e3)),
        finished_at: iso(new Date(Date.now() - 12 * 3600e3 + 4000)),
        duration_seconds: 4,
      },
    ],
    giftCards: [
      {
        id: 1,
        code: "DRS-GIFT-7Q2K",
        initial_amount: 500,
        balance: 320,
        status: "active",
        issued_to_account_id: 1,
        expires_at: "2027-03-31",
      },
      {
        id: 2,
        code: "DRS-GIFT-9XW4",
        initial_amount: 1000,
        balance: 0,
        status: "redeemed",
        issued_to_account_id: null,
        expires_at: null,
      },
    ],
    loyalty: [
      { account_id: 2, points_balance: 1840 },
      { account_id: 1, points_balance: 260 },
    ],
    notifications: [
      {
        id: 501,
        user_id: 11,
        event_type: "payment.success",
        channel: "whatsapp",
        category: "transactional",
        status: "sent",
        skip_reason: null,
        provider_message_id: "wamid.1",
        body: "Payment of ₹330 received for ORD-0007.",
        attempts: 1,
      },
      {
        id: 502,
        user_id: 12,
        event_type: "wallet.low",
        channel: "sms",
        category: "transactional",
        status: "failed",
        skip_reason: null,
        provider_message_id: null,
        body: "Your DRS wallet is running low.",
        attempts: 3,
      },
      {
        id: 503,
        user_id: 11,
        event_type: "marketing.promo",
        channel: "whatsapp",
        category: "marketing",
        status: "skipped",
        skip_reason: "opted_out",
        provider_message_id: null,
        body: null,
        attempts: 0,
      },
    ],
    webhooks: [{ id: 1, event_type: "payment.success", url: "https://erp.example/hooks/drs", active: true }],
    webhookDeliveries: [
      {
        id: 1,
        webhook_id: 1,
        event_type: "payment.success",
        status: "delivered",
        attempts: 1,
        response_code: 200,
      },
    ],
    churn: [
      { account_id: 2, score: 0.82, risk: "high" },
      { account_id: 1, score: 0.35, risk: "medium" },
    ],
    invoices: [
      {
        id: 1,
        invoice_no: "DRS/2026-27/0001",
        fy: "2026-27",
        account_id: 1,
        delivery_order_id: null,
        order_id: 7,
        invoice_date: today,
        seller_gstin: "08AAACD1234F1Z5",
        buyer_gstin: null,
        place_of_supply: "Rajasthan",
        is_interstate: false,
        taxable_value: 314.29,
        cgst: 7.86,
        sgst: 7.85,
        igst: 0,
        total: 330,
        is_credit_note: false,
        is_partial: false,
        original_invoice_id: null,
        status: "issued",
        lines: [
          {
            product_id: 2,
            hsn_code: "0403",
            description: "Masala Buttermilk 200 ml",
            qty: 10,
            unit_price: 31.43,
            taxable_value: 314.29,
            gst_rate: 5,
            cgst: 7.86,
            sgst: 7.85,
            igst: 0,
            line_total: 330,
          },
        ],
      },
    ],
  };
  db.b2b = seedB2b();
  return db;
}

// B2B subscriber (phone 9000000001): two shops, one on a standing order, deliveries and credit.
const addDaysIso = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
function seedB2b() {
  const tomorrow = addDaysIso(today, 1);
  const shopBase = { account_id: 60, state: "Delhi", status: "active" };
  const invoice = (n, total, date, extra = {}) => ({
    id: 600 + n,
    invoice_no: `DRS/2026-27/B${String(n).padStart(3, "0")}`,
    fy: "2026-27",
    account_id: 60,
    delivery_order_id: 700 + n,
    order_id: null,
    invoice_date: date,
    seller_gstin: "08AAACD1234F1Z5",
    buyer_gstin: "07AABCS1429B1ZB",
    place_of_supply: "Delhi",
    is_interstate: true,
    taxable_value: total,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total,
    is_credit_note: false,
    is_partial: false,
    original_invoice_id: null,
    status: "issued",
    lines: [],
    ...extra,
  });
  return {
    shops: [
      {
        id: 701,
        name: "Sharma Sweets, Karol Bagh",
        address: "14 Ajmal Khan Road",
        pincode: "110005",
        ...shopBase,
      },
      {
        id: 702,
        name: "Sharma Sweets, Lajpat Nagar",
        address: "B-22 Central Market",
        pincode: "110024",
        ...shopBase,
      },
    ],
    subs: [
      {
        id: 801,
        shop_id: 701,
        account_id: 60,
        status: "active",
        start_date: "2026-09-01",
        end_date: null,
        items: [
          {
            id: 9001,
            product_id: 1,
            default_qty: 20000,
            frequency: "daily",
            interval_days: null,
            days_of_week: null,
            active: true,
          },
          {
            id: 9002,
            product_id: 2,
            default_qty: 4000,
            frequency: "weekly",
            interval_days: null,
            days_of_week: "1,3,5",
            active: true,
          },
        ],
      },
    ],
    overrides: [],
    deliveries: [
      {
        id: 711,
        delivery_date: today,
        shop_id: 701,
        shop_name: "Sharma Sweets, Karol Bagh",
        origin: "subscription",
        status: "delivered",
        failure_reason: null,
        subtotal: 1320,
        total: 1320,
        amount_due: 0,
        items: [
          {
            product_id: 1,
            qty_planned: 20000,
            qty_delivered: 20000,
            unit_price: 0.066,
            line_total: 1320,
            status: "delivered",
          },
        ],
      },
      {
        id: 712,
        delivery_date: tomorrow,
        shop_id: 701,
        shop_name: "Sharma Sweets, Karol Bagh",
        origin: "subscription",
        status: "generated",
        failure_reason: null,
        subtotal: 1320,
        total: 1320,
        amount_due: 0,
        items: [
          {
            product_id: 1,
            qty_planned: 20000,
            qty_delivered: 0,
            unit_price: 0.066,
            line_total: 1320,
            status: "pending",
          },
        ],
      },
      {
        id: 713,
        delivery_date: tomorrow,
        shop_id: 702,
        shop_name: "Sharma Sweets, Lajpat Nagar",
        origin: "one_time",
        status: "generated",
        failure_reason: null,
        subtotal: 660,
        total: 660,
        amount_due: 660,
        items: [
          {
            product_id: 1,
            qty_planned: 10000,
            qty_delivered: 0,
            unit_price: 0.066,
            line_total: 660,
            status: "pending",
          },
        ],
      },
    ],
    invoices: [
      invoice(1, 1320, addDaysIso(today, -1)),
      invoice(2, 1320, today),
      invoice(3, 120, today, { is_credit_note: true, original_invoice_id: 601, delivery_order_id: null }),
    ],
    credit: [
      {
        id: 3,
        entry_type: "credit_note",
        amount: 120,
        balance_after: 1520,
        ref_type: "invoice",
        ref_id: 603,
        created_at: iso(),
      },
      {
        id: 2,
        entry_type: "charge",
        amount: 1320,
        balance_after: 1640,
        ref_type: "delivery_order",
        ref_id: 711,
        created_at: iso(),
      },
      {
        id: 1,
        entry_type: "payment",
        amount: 1000,
        balance_after: 320,
        ref_type: "payment",
        ref_id: 1,
        created_at: iso(),
      },
      {
        id: 0,
        entry_type: "charge",
        amount: 1320,
        balance_after: 1320,
        ref_type: "delivery_order",
        ref_id: 710,
        created_at: iso(),
      },
    ],
  };
}

let db = seed();
let failing = null;
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
/** Returned by a handler to let a later route (e.g. the admin one) take the request. */
const NEXT = Symbol("next");
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
        access_token: token(
          body.phone === "9000000000" ? "customer" : body.phone === "9000000001" ? "subscriber" : "admin",
        ),
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
  failing = null;
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
// Public storefront catalogue (no auth, like the backend).
on("GET", "/api/v1/products/categories", (req, res) =>
  send(res, 200, [
    ...new Set(
      db.products
        .filter((x) => x.status === "active")
        .map((x) => x.category)
        .filter(Boolean),
    ),
  ]),
);
// Storefront price of a pack: the variant's selling_price (null => price unavailable).
const pricedVariants = (pid) =>
  db.variants
    .filter((v) => v.product_id === Number(pid) && v.status === "active")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((v) => ({
      ...v,
      price_available: v.selling_price != null,
      show_mrp_strike: v.selling_price != null && v.mrp != null && v.mrp > v.selling_price,
    }));
const fromPrice = (pid) => {
  const known = pricedVariants(pid)
    .map((v) => v.selling_price)
    .filter((x) => x != null);
  return known.length ? Math.min(...known) : null;
};
const publicProduct = (x) => ({ ...x, from_price: fromPrice(x.id) });
const SORTS = {
  newest: (a, b) => b.id - a.id,
  rating: (a, b) => b.avg_rating - a.avg_rating,
  name: (a, b) => a.name.localeCompare(b.name),
};
on("GET", "/api/v1/products", (req, res, { q }) => {
  let rows = db.products.filter((x) => x.status === "active");
  if (q.get("category")) rows = rows.filter((x) => x.category === q.get("category"));
  const term = q.get("q")?.toLowerCase();
  if (term) rows = rows.filter((x) => x.name.toLowerCase().includes(term));
  rows = [...rows].sort(SORTS[q.get("sort")] ?? ((a, b) => a.id - b.id));
  const offset = Number(q.get("offset") ?? 0);
  const limit = Number(q.get("limit") ?? 50);
  send(res, 200, rows.slice(offset, offset + limit).map(publicProduct));
});
on("GET", "/api/v1/products/:pid/full", (req, res, { p }) => {
  const x = find(db.products, p.pid);
  if (!x || x.status !== "active") return send(res, 404, { detail: "Product not found" });
  send(res, 200, { ...publicProduct(x), variants: pricedVariants(x.id) });
});
on("GET", "/api/v1/products/:pid/ratings", (req, res, { p }) => {
  // Summary matches the product's own avg_rating/rating_count; the list is the latest few.
  const prod = find(db.products, p.pid);
  const rows = db.reviews.filter((r) => r.product_id === Number(p.pid));
  const count = prod?.rating_count ?? 0;
  const split = [0.02, 0.02, 0.06, 0.2]; // 1..4 stars; 5 stars takes the rest
  const distribution = Object.fromEntries(split.map((f, i) => [String(i + 1), Math.round(count * f)]));
  distribution["5"] = count - Object.values(distribution).reduce((a, b) => a + b, 0);
  send(res, 200, {
    product_id: Number(p.pid),
    count,
    average: prod?.avg_rating ?? 0,
    distribution,
    ratings: rows.map((r) => ({ ...r, user_id: null, mine: false, status: "approved", admin_reply: null })),
  });
});
// Customer cart: unit price = cheapest per-unit retail price, so qty = pack_size charges selling_price.
const cartOf = (headers) => {
  const key = headers.authorization ?? "anon";
  db.carts[key] ??= { id: Object.keys(db.carts).length + 1, status: "open", items: [] };
  const c = db.carts[key];
  return { ...c, subtotal: c.items.reduce((n, i) => n + i.line_total, 0) };
};
on("GET", "/api/v1/cart", (req, res, { headers }) => send(res, 200, cartOf(headers)));
on("POST", "/api/v1/cart/items", (req, res, { body, headers }) => {
  const prod = find(db.products, body.product_id);
  const priced = pricedVariants(body.product_id).filter((v) => v.selling_price != null);
  if (!prod || !priced.length || !(body.qty > 0))
    return send(res, 422, { detail: "This product can't be added right now." });
  const unit = Math.min(...priced.map((v) => v.selling_price / v.pack_size));
  cartOf(headers);
  const cart = db.carts[headers.authorization ?? "anon"];
  const line = cart.items.find((i) => i.product_id === prod.id);
  if (line) line.qty += body.qty;
  else cart.items.push({ id: id(), product_id: prod.id, qty: body.qty, unit_price: unit, line_total: 0 });
  cart.items.forEach((i) => (i.line_total = Math.round(i.unit_price * i.qty * 100) / 100));
  send(res, 200, cartOf(headers));
});
// Customer-owned rows carry the owner's token in `owner`; never sent back.
const withoutOwner = (row) => Object.fromEntries(Object.entries(row).filter(([k]) => k !== "owner"));
const myCart = (headers) => {
  cartOf(headers);
  return db.carts[headers.authorization ?? "anon"];
};
const reprice = (cart) =>
  cart.items.forEach((i) => (i.line_total = Math.round(i.unit_price * i.qty * 100) / 100));
const round2 = (n) => Math.round(n * 100) / 100;
on("PATCH", "/api/v1/cart/items/:iid", (req, res, { p, body, headers }) => {
  const cart = myCart(headers);
  const line = cart.items.find((i) => i.id === Number(p.iid));
  if (!line) return send(res, 404, { detail: "Cart item not found" });
  if (!(body.qty > 0)) return send(res, 422, { detail: "Quantity must be more than 0" });
  line.qty = body.qty;
  reprice(cart);
  send(res, 200, cartOf(headers));
});
on("DELETE", "/api/v1/cart/items/:iid", (req, res, { p, headers }) => {
  const cart = myCart(headers);
  cart.items = cart.items.filter((i) => i.id !== Number(p.iid));
  send(res, 200, cartOf(headers));
});
// Coupons: flat/percent with a minimum order value, like the backend's preview.
const couponDiscount = (code, subtotal) => {
  const c = db.coupons.find((x) => x.code.toUpperCase() === String(code).trim().toUpperCase() && x.active);
  if (!c) return { error: "This coupon code isn't valid." };
  if (c.min_order_value && subtotal < c.min_order_value)
    return { error: `Add ₹${c.min_order_value - subtotal} more to use ${c.code}.` };
  const raw = c.discount_type === "percent" ? (subtotal * c.value) / 100 : c.value;
  return { discount: round2(Math.min(raw, c.max_discount ?? raw, subtotal)) };
};
on("POST", "/api/v1/cart/coupon-preview", (req, res, { body, headers }) => {
  const { subtotal } = cartOf(headers);
  const r = couponDiscount(body.code, subtotal);
  if (r.error) return send(res, 422, { detail: r.error });
  send(res, 200, { code: body.code, discount: r.discount, final_total: round2(subtotal - r.discount) });
});
const quoteOf = (headers, couponCode) => {
  const cart = cartOf(headers);
  let discount = 0;
  if (couponCode) {
    const r = couponDiscount(couponCode, cart.subtotal);
    if (r.error) return { error: r.error };
    discount = r.discount;
  }
  const total = round2(cart.subtotal - discount);
  const factor = cart.subtotal > 0 ? total / cart.subtotal : 1;
  const items = cart.items.map((i) => {
    const rate = find(db.products, i.product_id)?.gst_rate ?? 0;
    const charged = round2(i.line_total * factor);
    return { ...i, gst_rate: rate, gst_amount: round2(charged - charged / (1 + rate / 100)) };
  });
  const tax_total = round2(items.reduce((n, i) => n + i.gst_amount, 0));
  return { items, subtotal: cart.subtotal, discount, tax_total, total, total_incl_tax: total };
};
// Serviceability (public): Jaipur pincodes (302xxx) are served next morning; 999999 is not.
const serviceability = (pin) =>
  pin === "999999" || !/^\d{6}$/.test(pin)
    ? { serviceable: false, etd_days: null, courier: null, rate: null }
    : { serviceable: true, etd_days: pin.startsWith("302") ? 1 : 3, courier: "DRS Fleet", rate: 0 };
on("GET", "/api/v1/shipping/serviceability", (req, res, { q }) => {
  if (!/^\d{6}$/.test(q.get("pincode") ?? "")) return send(res, 422, { detail: "Enter a 6-digit pincode" });
  send(res, 200, serviceability(q.get("pincode")));
});
on("POST", "/api/v1/cart/quote", (req, res, { body, headers }) => {
  const qt = quoteOf(headers, body.coupon_code);
  if (qt.error) return send(res, 422, { detail: qt.error });
  const svc = body.pincode ? serviceability(body.pincode) : null;
  send(res, 200, {
    ...qt,
    serviceable: svc?.serviceable ?? null,
    etd_days: svc?.etd_days ?? null,
    shipping_rate: svc?.rate ?? null,
  });
});
on("GET", "/api/v1/addresses", (req, res, { headers }) =>
  send(res, 200, db.addresses.filter((a) => a.owner === headers.authorization).map(withoutOwner)),
);
on("POST", "/api/v1/addresses", (req, res, { body, headers }) => {
  if (!body.line1 || !body.city || !body.state || !/^\d{6}$/.test(body.pincode ?? ""))
    return send(res, 422, { detail: "Please complete the address." });
  const mine = db.addresses.filter((a) => a.owner === headers.authorization);
  const a = {
    id: id(),
    account_id: 50,
    country: "IN",
    status: "active",
    label: null,
    contact_name: null,
    contact_phone: null,
    line2: null,
    landmark: null,
    ...body,
    is_default: body.is_default || mine.length === 0,
    owner: headers.authorization,
  };
  if (a.is_default) mine.forEach((m) => (m.is_default = false));
  db.addresses.push(a);
  send(res, 201, withoutOwner(a));
});
// Replays the stored response for a repeated Idempotency-Key (like the backend).
const idempotent = (headers, res, fn) => {
  const key = headers["idempotency-key"];
  if (!key) return send(res, 400, { detail: "Idempotency-Key header required" });
  if (db.idem[key]) return send(res, db.idem[key].status, db.idem[key].body);
  const out = fn();
  if (out.status < 500) db.idem[key] = out;
  send(res, out.status, out.body);
};
const orderView = withoutOwner;
on("POST", "/api/v1/cart/checkout", (req, res, { body, headers }) =>
  idempotent(headers, res, () => {
    if (body.address === "FAIL-ONCE" && !db.failedOnce) {
      db.failedOnce = true;
      return { status: 503, body: { detail: "Temporarily unavailable" } };
    }
    const cart = myCart(headers);
    if (!cart.items.length) return { status: 422, body: { detail: "Cart is empty" } };
    const qt = quoteOf(headers, body.coupon_code);
    if (qt.error) return { status: 422, body: { detail: qt.error } };
    const oid = id();
    const order = {
      id: oid,
      order_no: `DRS-${String(oid).padStart(6, "0")}`,
      account_id: 50,
      shop_id: 1,
      order_type: "one_time",
      status: "created",
      payment_status: "pending",
      subtotal: qt.subtotal,
      discount: qt.discount,
      coupon_code: body.coupon_code ?? null,
      total: qt.total,
      tax_total: qt.tax_total,
      total_incl_tax: qt.total,
      items: qt.items.map((i) => ({
        product_id: i.product_id,
        qty: i.qty,
        unit_price: i.unit_price,
        line_total: i.line_total,
        gst_rate: i.gst_rate,
        gst_amount: i.gst_amount,
        price_incl_tax: i.unit_price,
      })),
      owner: headers.authorization,
      address: body.address,
      pincode: body.pincode,
    };
    db.orders.push(order);
    db.carts[headers.authorization ?? "anon"] = { id: cart.id + 1, status: "open", items: [] };
    return { status: 200, body: orderView(order) };
  }),
);
on("GET", "/api/v1/orders", (req, res, { headers }) =>
  send(
    res,
    200,
    db.orders
      .filter((o) => o.owner && o.owner === headers.authorization)
      .sort((a, b) => b.id - a.id)
      .map(orderView),
  ),
);
on("GET", "/api/v1/orders/:oid/tracking", (req, res, { p, headers }) => {
  const o = find(db.orders, p.oid);
  if (!o || (o.owner && o.owner !== headers.authorization))
    return send(res, 404, { detail: "Order not found" });
  send(res, 200, {
    order_id: o.id,
    order_no: o.order_no,
    status: o.status,
    payment_status: o.payment_status,
    shipments: o.shipments ?? [],
  });
});
// --- customer account ---
const CUSTOMER = () => `Bearer ${token("customer")}`;
const isCustomer = (headers) => headers.authorization === CUSTOMER();
on("GET", "/api/v1/me/home", (req, res, { headers }) => {
  const mine = db.orders.filter((o) => o.owner === headers.authorization).sort((a, b) => b.id - a.id);
  send(res, 200, {
    wallet_balance: isCustomer(headers) ? db.custWallet.balance : 0,
    credit_outstanding: 0,
    loyalty_points: 120,
    active_subscriptions: 1,
    recent_orders: mine
      .slice(0, 5)
      .map((o) => ({ id: o.id, order_no: o.order_no, status: o.status, total: o.total })),
    banners: [],
    recommendations: [],
  });
});
on("GET", "/api/v1/profile", (req, res) => send(res, 200, db.custProfile));
on("PATCH", "/api/v1/profile", (req, res, { body }) => {
  if (body.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email))
    return send(res, 422, { detail: "Enter a valid email address" });
  if (body.email && body.email !== db.custProfile.email) db.custProfile.email_verified = false;
  Object.assign(db.custProfile, body);
  send(res, 200, db.custProfile);
});
const ownedAddress = (headers, aid) =>
  db.addresses.find((a) => a.id === Number(aid) && a.owner === headers.authorization);
on("PATCH", "/api/v1/addresses/:aid", (req, res, { p, body, headers }) => {
  const a = ownedAddress(headers, p.aid);
  if (!a) return send(res, 404, { detail: "Address not found" });
  if (body.pincode && !/^\d{6}$/.test(body.pincode))
    return send(res, 422, { detail: "Enter a 6-digit pincode" });
  Object.assign(a, body);
  send(res, 200, withoutOwner(a));
});
on("POST", "/api/v1/addresses/:aid/default", (req, res, { p, headers }) => {
  const a = ownedAddress(headers, p.aid);
  if (!a) return send(res, 404, { detail: "Address not found" });
  db.addresses.filter((x) => x.owner === headers.authorization).forEach((x) => (x.is_default = x === a));
  send(res, 200, withoutOwner(a));
});
on("DELETE", "/api/v1/addresses/:aid", (req, res, { p, headers }) => {
  const a = ownedAddress(headers, p.aid);
  if (!a) return send(res, 404, { detail: "Address not found" });
  db.addresses = db.addresses.filter((x) => x !== a);
  if (a.is_default) {
    const next = db.addresses.find((x) => x.owner === headers.authorization);
    if (next) next.is_default = true;
  }
  send(res, 204);
});
on("GET", "/api/v1/billing/me", (req, res, { headers }) => {
  if (!isCustomer(headers)) return send(res, 404, { detail: "No billing account for this user" });
  send(res, 200, {
    account_id: 50,
    billing_mode: "prepaid_wallet",
    wallet_balance: db.custWallet.balance,
    credit_outstanding: 0,
    recent_wallet_txns: db.custWallet.txns
      .slice(0, 5)
      .map(({ txn_type, amount, balance_after }) => ({ txn_type, amount, balance_after })),
  });
});
on("GET", "/api/v1/billing/transactions", (req, res, { q, headers }) => {
  const rows = isCustomer(headers) ? db.custWallet.txns : [];
  const limit = Number(q.get("limit") ?? 20);
  const offset = Number(q.get("offset") ?? 0);
  send(res, 200, rows.slice(offset, offset + limit), {
    "x-total-count": String(rows.length),
    "access-control-expose-headers": "X-Total-Count",
  });
});
// --- B2B self-service (subscriber role); other callers fall through to the routes below ---
const SUBSCRIBER = () => `Bearer ${token("subscriber")}`;
const isSubscriber = (headers) => headers.authorization === SUBSCRIBER();
const b2bSub = (sid) => db.b2b.subs.find((s) => s.id === Number(sid));
const subOut = (s) => Object.fromEntries(Object.entries(s).filter(([k]) => k !== "items"));
const subDetail = (s) => ({ ...subOut(s), items: s.items });
const cadenceMatch = (it, sub, date) => {
  if (it.frequency === "weekly") {
    const [y, m, d] = date.split("-").map(Number);
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() || 7;
    return (it.days_of_week ?? "").split(",").map(Number).includes(dow);
  }
  if (it.frequency === "alternate") {
    const days = Math.round((Date.parse(date) - Date.parse(sub.start_date)) / 86400000);
    return days % (it.interval_days ?? 2) === 0;
  }
  return true;
};
on("GET", "/api/v1/shops", (req, res, { q, headers }) =>
  isSubscriber(headers) ? page(res, db.b2b.shops, q) : page(res, [], q),
);
on("POST", "/api/v1/shops", (req, res, { body, headers }) => {
  if (!isSubscriber(headers)) return send(res, 403, { detail: "Only subscribers can add shops" });
  if (!body.name?.trim()) return send(res, 422, { detail: "name is required" });
  const shop = {
    id: id(),
    account_id: 60,
    name: body.name,
    address: body.address ?? null,
    state: body.state ?? null,
    pincode: body.pincode ?? null,
    status: "active",
  };
  db.b2b.shops.push(shop);
  send(res, 200, shop);
});
on("GET", "/api/v1/subscriptions", (req, res, { q, headers }) =>
  page(res, isSubscriber(headers) ? db.b2b.subs.map(subOut) : [], q),
);
on("POST", "/api/v1/subscriptions", (req, res, { body, headers }) => {
  if (!isSubscriber(headers)) return send(res, 403, { detail: "Only subscribers manage subscriptions" });
  const shop = db.b2b.shops.find((x) => x.id === body.shop_id);
  if (!shop) return send(res, 404, { detail: "Shop not found" });
  if (shop.status !== "active") return send(res, 409, { detail: "Shop is not active" });
  let sub = db.b2b.subs.find((x) => x.shop_id === shop.id);
  if (!sub) {
    sub = {
      id: id(),
      shop_id: shop.id,
      account_id: 60,
      status: "active",
      start_date: today,
      end_date: null,
      items: [],
    };
    db.b2b.subs.push(sub);
  } else if (sub.status === "cancelled")
    Object.assign(sub, { status: "active", start_date: today, end_date: null });
  send(res, 200, subOut(sub));
});
on("GET", "/api/v1/subscriptions/:sid", (req, res, { p, headers }) => {
  const s = isSubscriber(headers) && b2bSub(p.sid);
  return s ? send(res, 200, subDetail(s)) : send(res, 404, { detail: "Subscription not found" });
});
on("PUT", "/api/v1/subscriptions/:sid/items", (req, res, { p, body, headers }) => {
  if (!isSubscriber(headers)) return NEXT;
  const s = b2bSub(p.sid);
  if (!s) return send(res, 404, { detail: "Subscription not found" });
  if (new Set(body.map((i) => i.product_id)).size !== body.length)
    return send(res, 422, { detail: "Each product may appear only once" });
  const bad = body.find((i) => !find(db.products, i.product_id)?.is_subscribable);
  if (bad) return send(res, 422, { detail: `Product(s) not available: [${bad.product_id}]` });
  const old = new Map(s.items.map((i) => [i.product_id, i]));
  s.items = [
    ...body.map((i) => ({
      interval_days: null,
      days_of_week: null,
      ...i,
      id: old.get(i.product_id)?.id ?? id(),
      active: true,
    })),
    ...s.items
      .filter((i) => !body.some((b) => b.product_id === i.product_id))
      .map((i) => ({ ...i, active: false })),
  ];
  send(res, 200, subDetail(s));
});
on("POST", "/api/v1/subscriptions/:sid/overrides", (req, res, { p, body, headers }) => {
  const s = isSubscriber(headers) && b2bSub(p.sid);
  if (!s) return send(res, 404, { detail: "Subscription not found" });
  if (!(body.for_date > today))
    return send(res, 422, { detail: "You can only modify tomorrow or a later date" });
  const item = s.items.find((i) => i.product_id === body.product_id && i.active);
  if (!item) return send(res, 404, { detail: "Product not in this subscription" });
  db.b2b.overrides = db.b2b.overrides.filter((o) => !(o.item_id === item.id && o.for_date === body.for_date));
  db.b2b.overrides.push({ item_id: item.id, for_date: body.for_date, qty: body.override_qty });
  send(res, 200, {
    detail: "override saved",
    product_id: body.product_id,
    for_date: body.for_date,
    qty: body.override_qty,
  });
});
on("GET", "/api/v1/subscriptions/:sid/plan", (req, res, { p, q, headers }) => {
  const s = isSubscriber(headers) && b2bSub(p.sid);
  if (!s) return send(res, 404, { detail: "Subscription not found" });
  const date = q.get("date") ?? addDaysIso(today, 1);
  const lines = [];
  if (s.status === "active" && date >= s.start_date)
    for (const it of s.items.filter((i) => i.active)) {
      const ov = db.b2b.overrides.find((o) => o.item_id === it.id && o.for_date === date);
      const qty = ov ? ov.qty : cadenceMatch(it, s, date) ? it.default_qty : 0;
      if (qty > 0) lines.push({ product_id: it.product_id, qty });
    }
  send(res, 200, { for_date: date, lines });
});
on("POST", "/api/v1/subscriptions/:sid/:act", (req, res, { p, headers }) => {
  if (!isSubscriber(headers)) return NEXT;
  const s = b2bSub(p.sid);
  if (!s) return send(res, 404, { detail: "Subscription not found" });
  const [to, from] = {
    pause: ["paused", ["active"]],
    resume: ["active", ["paused"]],
    cancel: ["cancelled", ["active", "paused"]],
  }[p.act];
  if (s.status !== to && !from.includes(s.status))
    return send(res, 409, { detail: `Cannot ${to} a ${s.status} subscription` });
  s.status = to;
  if (to === "cancelled") s.end_date = today;
  send(res, 200, subOut(s));
});
on("GET", "/api/v1/delivery/orders", (req, res, { q, headers }) => {
  if (!isSubscriber(headers)) return NEXT;
  const date = q.get("date") ?? addDaysIso(today, 1);
  page(
    res,
    db.b2b.deliveries.filter((d) => d.delivery_date === date),
    q,
  );
});
on("GET", "/api/v1/invoices", (req, res, { q, headers }) => {
  if (!isSubscriber(headers)) return NEXT;
  page(res, [...db.b2b.invoices].reverse(), q);
});
on("GET", "/api/v1/invoices/:iid/pdf", (req, res, { p, headers }) => {
  if (!isSubscriber(headers)) return NEXT;
  const i = find(db.b2b.invoices, p.iid);
  if (!i) return send(res, 404, { detail: "Invoice not found" });
  send(res, 200, {
    invoice_no: i.invoice_no,
    pdf_url: `/files/private/invoices/${i.id}.pdf?exp=4102444800&sig=mock`,
  });
});
on("GET", "/api/v1/billing/credit-statement", (req, res, { q, headers }) =>
  page(res, isSubscriber(headers) ? db.b2b.credit : [], q),
);

// --- customer engagement (loyalty, gift cards, wishlist, support, inbox, DPDP) ---
on("GET", "/api/v1/loyalty", (req, res) =>
  send(res, 200, { account_id: 50, points_balance: db.custLoyalty.balance, recent: db.custLoyalty.ledger }),
);
on("GET", "/api/v1/loyalty/referral-code", (req, res) => send(res, 200, db.custLoyalty.referral));
on("POST", "/api/v1/loyalty/referral/redeem", (req, res, { body }) => {
  const code = String(body.code ?? "")
    .trim()
    .toUpperCase();
  if (code === db.custLoyalty.referral.code)
    return send(res, 422, { detail: "You can't use your own referral code" });
  if (db.custLoyalty.redeemedReferral)
    return send(res, 409, { detail: "You've already used a referral code" });
  if (code !== "FRIEND100") return send(res, 404, { detail: "Referral code not found" });
  db.custLoyalty.redeemedReferral = true;
  send(res, 200, { detail: "Referral redeemed; the referrer is rewarded on your first paid order", code });
});
const giftView = (g) => Object.fromEntries(Object.entries(g).filter(([k]) => k !== "mine"));
on("GET", "/api/v1/loyalty/gift-cards", (req, res) =>
  send(res, 200, db.custGiftCards.filter((g) => g.mine).map(giftView)),
);
on("GET", "/api/v1/loyalty/gift-cards/:code/balance", (req, res, { p }) => {
  const g = db.custGiftCards.find((x) => x.code === decodeURIComponent(p.code).toUpperCase());
  return g ? send(res, 200, giftView(g)) : send(res, 404, { detail: "Gift card not found" });
});
on("POST", "/api/v1/loyalty/gift-cards/redeem", (req, res, { body }) => {
  const g = db.custGiftCards.find((x) => x.code === String(body.code ?? "").toUpperCase());
  if (!g) return send(res, 404, { detail: "Gift card not found" });
  if (g.status !== "active") return send(res, 409, { detail: `Gift card is ${g.status}` });
  if (!(body.amount > 0)) return send(res, 422, { detail: "amount must be > 0" });
  if (body.amount > g.balance) return send(res, 422, { detail: "Amount exceeds gift-card balance" });
  g.balance = round2(g.balance - body.amount);
  g.mine = true;
  if (g.balance === 0) g.status = "redeemed";
  db.custWallet.balance = round2(db.custWallet.balance + body.amount);
  db.custWallet.txns.unshift({
    id: id(),
    txn_type: "giftcard",
    amount: body.amount,
    balance_after: db.custWallet.balance,
    ref_type: "gift_card_txn",
    ref_id: id(),
    created_at: new Date().toISOString(),
  });
  send(res, 200, giftView(g));
});
const wishlistView = () => db.custWishlist.map((product_id) => ({ product_id }));
on("GET", "/api/v1/wishlist", (req, res) => send(res, 200, wishlistView()));
on("POST", "/api/v1/wishlist", (req, res, { body }) => {
  const prod = find(db.products, body.product_id);
  if (!prod || prod.status !== "active") return send(res, 404, { detail: "Product not found" });
  if (!db.custWishlist.includes(prod.id)) db.custWishlist.push(prod.id);
  send(res, 200, wishlistView());
});
on("DELETE", "/api/v1/wishlist/:pid", (req, res, { p }) => {
  db.custWishlist = db.custWishlist.filter((x) => x !== Number(p.pid));
  send(res, 204);
});
on("GET", "/api/v1/support/tickets", (req, res) =>
  send(
    res,
    200,
    [...db.custTickets].sort((a, b) => b.id - a.id),
  ),
);
on("POST", "/api/v1/support/tickets", (req, res, { body }) => {
  if (!body.subject?.trim() || !body.body?.trim())
    return send(res, 422, { detail: "Subject and message are required" });
  const tid = id();
  const t = {
    id: tid,
    ticket_no: `TKT-${String(tid).padStart(6, "0")}`,
    subject: body.subject.trim(),
    category: body.category ?? "other",
    status: "open",
    priority: "normal",
    messages: [{ id: id(), sender_role: "customer", body: body.body.trim(), attachment_url: null }],
  };
  db.custTickets.push(t);
  send(res, 200, t);
});
on("GET", "/api/v1/support/tickets/:tid", (req, res, { p }) => {
  const t = find(db.custTickets, p.tid);
  return t ? send(res, 200, t) : send(res, 404, { detail: "Ticket not found" });
});
on("POST", "/api/v1/support/tickets/:tid/messages", (req, res, { p, body }) => {
  const t = find(db.custTickets, p.tid);
  if (!t) return send(res, 404, { detail: "Ticket not found" });
  if (!body.body?.trim()) return send(res, 422, { detail: "Write a message" });
  t.messages.push({ id: id(), sender_role: "customer", body: body.body.trim(), attachment_url: null });
  if (t.status !== "open") t.status = "open";
  send(res, 200, t);
});
on("GET", "/api/v1/notifications/unread-count", (req, res) =>
  send(res, 200, { unread: db.custNotifications.filter((n) => !n.read_at).length }),
);
on("GET", "/api/v1/notifications", (req, res, { q }) => {
  const rows =
    q.get("unread_only") === "true" ? db.custNotifications.filter((n) => !n.read_at) : db.custNotifications;
  send(res, 200, rows);
});
on("POST", "/api/v1/notifications/read-all", (req, res) => {
  db.custNotifications.forEach((n) => (n.read_at ??= new Date().toISOString()));
  send(res, 200, { unread: 0 });
});
on("POST", "/api/v1/notifications/:nid/read", (req, res, { p }) => {
  const n = find(db.custNotifications, p.nid);
  if (!n) return send(res, 404, { detail: "Notification not found" });
  n.read_at ??= new Date().toISOString();
  send(res, 200, n);
});
on("GET", "/api/v1/consents", (req, res) => send(res, 200, db.custConsents));
on("POST", "/api/v1/consents", (req, res, { body }) => {
  db.custConsents[body.purpose] = body.action;
  send(res, 201, {
    id: id(),
    purpose: body.purpose,
    action: body.action,
    source: "web",
    created_at: new Date().toISOString(),
  });
});
on("GET", "/api/v1/account/export", (req, res) =>
  send(res, 200, {
    user: { id: 50, phone: "9000000000", role: "customer" },
    profile: db.custProfile,
    addresses: db.addresses.filter((a) => a.owner === CUSTOMER()).map(withoutOwner),
    payment_methods: [],
    orders: db.orders.filter((o) => o.owner === CUSTOMER()).map(withoutOwner),
  }),
);
on("POST", "/api/v1/account/erase", (req, res, { body }) => {
  if (body.otp !== "123456") return send(res, 403, { detail: "Invalid or expired OTP" });
  db.custErased = true;
  send(res, 200, {
    detail: "Account erased",
    user_id: 50,
    retained: "Tax invoices and payment records are kept for 8 years as required by law.",
  });
});
// --- public CMS (no auth) ---
on("GET", "/api/v1/content/articles", (req, res, { q }) => {
  let rows = db.publicContent.articles.filter((a) => a.status === "published");
  if (q.get("category")) rows = rows.filter((a) => a.category === q.get("category"));
  const offset = Number(q.get("offset") ?? 0);
  const limit = Number(q.get("limit") ?? 50);
  send(res, 200, rows.slice(offset, offset + limit));
});
on("GET", "/api/v1/content/articles/:slug", (req, res, { p }) => {
  const a = db.publicContent.articles.find((x) => x.slug === p.slug && x.status === "published");
  return a ? send(res, 200, a) : send(res, 404, { detail: "Article not found" });
});
on("GET", "/api/v1/content/pages/:slug", (req, res, { p }) => {
  const pg = db.publicContent.pages.find((x) => x.slug === p.slug && x.status === "published");
  return pg ? send(res, 200, pg) : send(res, 404, { detail: "Page not found" });
});
on("GET", "/api/v1/content/banners", (req, res) =>
  send(
    res,
    200,
    db.publicContent.banners.filter((b) => b.active).sort((a, b) => a.position - b.position),
  ),
);
// Backend serves the sitemap at the domain root (the web app rewrites /sitemap.xml here).
on("GET", "/sitemap.xml", (req, res) => {
  res.writeHead(200, { "content-type": "application/xml" });
  res.end(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      [
        "/",
        "/shop",
        "/blog",
        ...db.publicContent.articles.map((a) => `/blog/${a.slug}`),
        ...db.publicContent.pages.map((p) => `/${p.slug}`),
      ]
        .map((u) => `<url><loc>https://drs.co.in${u}</loc></url>`)
        .join("") +
      "</urlset>",
  );
});
// Content images (SVG placeholders): a cream tile with the title's first letter.
on("GET", "/files/media/products/:name", (req, res, { p }) => {
  if (p.name !== "milk.svg") return send(res, 404, { detail: "Not found" });
  res.writeHead(200, { "content-type": "image/svg+xml" });
  res.end(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#DCEBF2"/><rect x="160" y="60" width="80" height="180" rx="16" fill="#fff" stroke="#0D4C3C" stroke-width="6"/></svg>',
  );
});
on("GET", "/files/content/.+", (req, res) => {
  res.writeHead(200, { "content-type": "image/svg+xml" });
  res.end(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="#0D4C3C"/><circle cx="640" cy="120" r="160" fill="#F4EADE" opacity="0.12"/><path d="M0 380 Q400 300 800 380 V450 H0Z" fill="#C5A253" opacity="0.35"/></svg>',
  );
});
on("POST", "/api/v1/payments/create", (req, res, { body, headers }) =>
  idempotent(headers, res, () => {
    if (body.purpose === "wallet_topup") {
      if (!(body.amount > 0)) return { status: 422, body: { detail: "amount required for top-up" } };
      const pay = {
        id: id(),
        gateway_order_id: `order_dev_${id()}`,
        topup: body.amount,
        status: "initiated",
      };
      db.onlinePayments.push(pay);
      return {
        status: 200,
        body: { payment_id: pay.id, gateway_order_id: pay.gateway_order_id, amount: body.amount, key_id: "" },
      };
    }
    const o = find(db.orders, body.order_id);
    if (body.purpose !== "order_payment" || !o || o.owner !== headers.authorization)
      return { status: 404, body: { detail: "Order not found" } };
    if (o.payment_status === "paid") return { status: 409, body: { detail: "Order already paid" } };
    const pay = { id: id(), gateway_order_id: `order_dev_${id()}`, order_id: o.id, status: "initiated" };
    db.onlinePayments.push(pay);
    // Dev stub (no Razorpay keys): empty key_id, verify accepts signature "dev".
    return {
      status: 200,
      body: { payment_id: pay.id, gateway_order_id: pay.gateway_order_id, amount: o.total, key_id: "" },
    };
  }),
);
on("POST", "/api/v1/payments/verify", (req, res, { body }) => {
  const pay = db.onlinePayments.find((x) => x.gateway_order_id === body.gateway_order_id);
  if (!pay) return send(res, 404, { detail: "Payment not found" });
  if (body.signature !== "dev") return send(res, 400, { detail: "Signature verification failed" });
  pay.status = "success";
  if (pay.topup) {
    db.custWallet.balance += pay.topup;
    db.custWallet.txns.unshift({
      id: id(),
      txn_type: "topup",
      amount: pay.topup,
      balance_after: db.custWallet.balance,
      ref_type: "payment",
      ref_id: pay.id,
      created_at: new Date().toISOString(),
    });
    return send(res, 200, { detail: "payment successful", payment_id: pay.id, status: "success" });
  }
  const o = find(db.orders, pay.order_id);
  o.payment_status = "paid";
  o.status = "confirmed";
  send(res, 200, { detail: "payment successful", payment_id: pay.id, status: "success" });
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
  const name = String(body.name ?? "").trim();
  if (db.locations.some((x) => x.name.toLowerCase() === name.toLowerCase()))
    return send(res, 409, { detail: "A location with this name already exists" });
  body.name = name;
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
  if (!o) return send(res, 404, { detail: "Delivery order not found" });
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

// --- returns / subscriptions / shops / users / cutoff ---
const owner = (accountId) => {
  const a = db.accounts.find((x) => x.id === accountId);
  return { name: a?.full_name ?? null, phone: a?.phone ?? null };
};
const rmaDetail = (r) => {
  const credits = db.walletTx[r.account_id].filter((t) => t.ref_type === "rma" && t.ref_id === r.id);
  const refunded = db.rmas.filter((x) => x.order_id === r.order_id).reduce((a, x) => a + x.refund_amount, 0);
  return {
    ...r,
    order_no: "ORD-0007",
    order_total: 330,
    order_payment_status: "paid",
    customer_name: owner(r.account_id).name,
    customer_phone: owner(r.account_id).phone,
    returned_value: r.items.reduce((a, i) => a + i.qty * 33, 0),
    refundable_headroom: Math.max(0, 330 - refunded),
    refund_credits: credits.map((t) => ({
      id: t.id,
      amount: t.amount,
      balance_after: t.balance_after,
      created_at: t.created_at,
    })),
    credit_notes: [],
  };
};
on("GET", "/api/v1/admin/returns", (req, res, { q }) => page(res, byStatus(db.rmas, q), q));
on("GET", "/api/v1/admin/returns/:rid", (req, res, { p }) => send(res, 200, rmaDetail(find(db.rmas, p.rid))));
on("POST", "/api/v1/admin/returns/:rid/:act", (req, res, { p, body }) => {
  const r = find(db.rmas, p.rid);
  if (p.act === "approve") r.status = "approved";
  if (p.act === "reject") Object.assign(r, { status: "rejected", resolution: body.note ?? null });
  if (p.act === "refund") {
    const d = rmaDetail(r);
    if (body.amount > Math.min(d.returned_value, d.refundable_headroom))
      return send(res, 422, { detail: "Refund exceeds returned value" });
    db.wallet[r.account_id] += body.amount;
    db.walletTx[r.account_id].push({
      id: id(),
      entry_type: "refund",
      amount: body.amount,
      balance_after: db.wallet[r.account_id],
      ref_type: "rma",
      ref_id: r.id,
      created_at: iso(),
    });
    Object.assign(r, { status: "refunded", refund_amount: body.amount });
  }
  send(res, 200, r);
});

const subRow = (s) => {
  const shop = db.shops.find((x) => x.id === s.shop_id);
  const o = owner(s.account_id);
  return {
    ...s,
    shop_name: shop?.name ?? null,
    customer_name: o.name,
    customer_phone: o.phone,
    item_count: s.items.filter((i) => i.active).length,
  };
};
on("GET", "/api/v1/admin/subscriptions", (req, res, { q }) => {
  let rows = byStatus(db.subs, q);
  if (q.get("shop_id")) rows = rows.filter((s) => s.shop_id === Number(q.get("shop_id")));
  page(res, rows.map(subRow), q);
});
on("GET", "/api/v1/admin/subscriptions/:sid", (req, res, { p }) => {
  const s = find(db.subs, p.sid);
  const shop = db.shops.find((x) => x.id === s.shop_id);
  send(res, 200, {
    ...subRow(s),
    shop_address: shop.address,
    shop_pincode: shop.pincode,
    shop_status: shop.status,
    price_tier_id: shop.price_tier_id,
  });
});
on("PUT", "/api/v1/subscriptions/:sid/items", (req, res, { p, body }) => {
  const s = find(db.subs, p.sid);
  if (new Set(body.map((i) => i.product_id)).size !== body.length)
    return send(res, 422, { detail: "Each product may appear only once" });
  s.items = body.map((i) => ({ id: id(), interval_days: null, days_of_week: null, ...i, active: true }));
  send(res, 200, s);
});
on("POST", "/api/v1/subscriptions/:sid/:act", (req, res, { p }) => {
  const s = find(db.subs, p.sid);
  s.status = { pause: "paused", resume: "active", cancel: "cancelled" }[p.act];
  send(res, 200, s);
});

const shopRow = (s) => {
  const sub = db.subs.find((x) => x.shop_id === s.id);
  const o = owner(s.account_id);
  return {
    ...s,
    customer_name: o.name,
    customer_phone: o.phone,
    subscription_id: sub?.id ?? null,
    subscription_status: sub?.status ?? null,
  };
};
on("GET", "/api/v1/admin/shops", (req, res, { q }) => {
  let rows = db.shops;
  if (q.get("status_filter")) rows = rows.filter((s) => s.status === q.get("status_filter"));
  const term = q.get("q")?.toLowerCase();
  if (term)
    rows = rows.filter((s) => s.name.toLowerCase().includes(term) || (s.pincode ?? "").includes(term));
  page(res, rows.map(shopRow), q);
});
on("GET", "/api/v1/admin/shops/:sid", (req, res, { p }) => {
  const s = find(db.shops, p.sid);
  if (!s) return send(res, 404, { detail: "Shop not found" });
  const drivers = db.assignments
    .filter((a) => a.shop_id === s.id)
    .map((a) => {
      const u = db.users.find((x) => x.id === a.delivery_id);
      return {
        assignment_id: a.id,
        delivery_id: u.id,
        full_name: u.full_name,
        phone: u.phone,
        active: a.active,
      };
    });
  send(res, 200, { ...shopRow(s), drivers });
});
on("PATCH", "/api/v1/admin/shops/:sid", (req, res, { p, body }) =>
  send(res, 200, Object.assign(find(db.shops, p.sid), body)),
);
on("POST", "/api/v1/admin/shops/:sid/tier", (req, res, { p, body }) => {
  find(db.shops, p.sid).price_tier_id = body.price_tier_id;
  send(res, 200, { detail: "tier set", shop_id: Number(p.sid), price_tier_id: body.price_tier_id });
});
on("POST", "/api/v1/admin/delivery-assignments", (req, res, { body }) => {
  const existing = db.assignments.find(
    (a) => a.shop_id === body.shop_id && a.delivery_id === body.delivery_id,
  );
  if (existing) existing.active = true;
  else db.assignments.push({ id: id(), ...body, active: true });
  send(res, 200, existing ?? db.assignments.at(-1));
});
on("GET", "/api/v1/admin/delivery-assignments", (req, res, { q }) => {
  let rows = [...db.assignments].sort((a, b) => b.id - a.id);
  if (q.get("delivery_id")) rows = rows.filter((a) => a.delivery_id === Number(q.get("delivery_id")));
  if (q.get("shop_id")) rows = rows.filter((a) => a.shop_id === Number(q.get("shop_id")));
  if (q.get("active")) rows = rows.filter((a) => a.active === (q.get("active") === "true"));
  const named = rows.map((a) => {
    const u = db.users.find((x) => x.id === a.delivery_id);
    const s = db.shops.find((x) => x.id === a.shop_id);
    return {
      ...a,
      driver_name: u?.full_name ?? null,
      driver_phone: u?.phone ?? null,
      driver_status: u?.status ?? null,
      shop_name: s?.name ?? null,
      shop_pincode: s?.pincode ?? null,
      shop_status: s?.status ?? null,
      created_at: a.created_at ?? iso(),
    };
  });
  page(res, named, q);
});
on("DELETE", "/api/v1/admin/delivery-assignments/:aid", (req, res, { p }) => {
  const a = find(db.assignments, p.aid);
  if (!a) return send(res, 404, { detail: "Assignment not found" });
  a.active = false;
  send(res, 204);
});
on("GET", "/api/v1/admin/users", (req, res, { q }) => {
  let rows = db.users;
  if (q.get("role")) rows = rows.filter((u) => u.role === q.get("role"));
  if (q.get("status_filter")) rows = rows.filter((u) => u.status === q.get("status_filter"));
  const term = q.get("q")?.toLowerCase();
  if (term)
    rows = rows.filter((u) => u.phone.includes(term) || (u.full_name ?? "").toLowerCase().includes(term));
  page(res, rows, q);
});
on("PATCH", "/api/v1/admin/users/:uid", (req, res, { p, body }) =>
  send(res, 200, Object.assign(find(db.users, p.uid), body)),
);
on("GET", "/api/v1/admin/cutoff/runs", (req, res, { q }) =>
  page(res, [...byStatus(db.cutoffRuns, q)].reverse(), q),
);
on("GET", "/api/v1/admin/cutoff/status", (req, res) => {
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(Date.now() + 86400e3),
  );
  const tRun = [...db.cutoffRuns].reverse().find((r) => r.for_delivery_date === tomorrow) ?? null;
  send(res, 200, {
    timezone: "Asia/Kolkata",
    cutoff_hour: 23,
    now: iso(),
    next_cutoff_at: iso(new Date(Date.now() + 6 * 3600e3)),
    next_delivery_date: tomorrow,
    tomorrow_run: tRun,
    last_run: db.cutoffRuns.at(-1) ?? null,
    standing_changes_frozen: false,
  });
});
on("POST", "/api/v1/admin/cutoff/run", (req, res, { q }) => {
  const date = q.get("date");
  const run = {
    id: id(),
    for_delivery_date: date,
    status: "frozen",
    orders_generated: db.subs.filter((s) => s.status === "active").length,
    started_at: iso(),
    finished_at: iso(),
    duration_seconds: 1.2,
  };
  db.cutoffRuns.push(run);
  send(res, 200, { schedule_run_id: run.id, delivery_date: date, orders_generated: run.orders_generated });
});

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

// --- Phase 5: loyalty, gift cards, notifications, webhooks, ML, invoices, exports ---
on("GET", "/api/v1/admin/gift-cards", (req, res, { q }) => {
  let rows = byStatus([...db.giftCards].reverse(), q);
  if (q.get("issued_to")) rows = rows.filter((c) => c.issued_to_account_id === Number(q.get("issued_to")));
  page(res, rows, q);
});
on("POST", "/api/v1/admin/gift-cards", (req, res, { body }) => {
  if (!(body.amount > 0)) return send(res, 422, { detail: "amount must be > 0" });
  const card = {
    id: id(),
    code: `DRS-GIFT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    initial_amount: body.amount,
    balance: body.amount,
    status: "active",
    issued_to_account_id: body.issued_to_account_id ?? null,
    expires_at: body.expires_at ?? null,
  };
  db.giftCards.push(card);
  send(res, 200, card);
});
on("POST", "/api/v1/admin/gift-cards/:cid/void", (req, res, { p }) => {
  const c = find(db.giftCards, p.cid);
  if (!c) return send(res, 404, { detail: "Gift card not found" });
  c.status = "disabled";
  send(res, 200, c);
});
on("GET", "/api/v1/admin/loyalty", (req, res, { q }) =>
  page(
    res,
    [...db.loyalty].sort((a, b) => b.points_balance - a.points_balance),
    q,
  ),
);
on("POST", "/api/v1/admin/loyalty/:aid/adjust", (req, res, { p, body }) => {
  let row = db.loyalty.find((l) => l.account_id === Number(p.aid));
  if (!row) db.loyalty.push((row = { account_id: Number(p.aid), points_balance: 0 }));
  if (row.points_balance + body.points < 0) return send(res, 409, { detail: "Insufficient points" });
  row.points_balance += body.points;
  send(res, 200, {
    ...row,
    recent: [{ delta: body.points, reason: body.reason ?? "adjust", balance_after: row.points_balance }],
  });
});
on("GET", "/api/v1/admin/notifications", (req, res, { q }) => {
  let rows = byStatus(
    [...db.notifications].sort((a, b) => b.id - a.id),
    q,
  );
  if (q.get("user_id")) rows = rows.filter((n) => n.user_id === Number(q.get("user_id")));
  // Like the backend: no X-Total-Count on this list.
  const limit = Number(q.get("limit") ?? 50);
  const offset = Number(q.get("offset") ?? 0);
  send(res, 200, rows.slice(offset, offset + limit));
});
on("POST", "/api/v1/admin/notifications/:nid/resend", (req, res, { p }) => {
  const n = find(db.notifications, p.nid);
  if (!n) return send(res, 404, { detail: "Notification not found" });
  n.status = "queued";
  n.skip_reason = null;
  send(res, 200, { id: n.id, status: n.status });
});
on("POST", "/api/v1/admin/notifications/test", (req, res, { body }) => {
  const created = ["whatsapp", "push"].map((channel) => {
    const n = {
      id: id(),
      user_id: body.user_id,
      event_type: body.event_type,
      channel,
      category: "transactional",
      status: "queued",
      skip_reason: null,
      provider_message_id: null,
      body: `Test: ${body.event_type}`,
      attempts: 0,
    };
    db.notifications.push(n);
    return { id: n.id, channel, status: "queued", skip_reason: null };
  });
  send(res, 200, { created });
});
on("POST", "/api/v1/admin/notifications/flush", (req, res) => {
  const queued = db.notifications.filter((n) => n.status === "queued");
  queued.forEach((n) => ((n.status = "sent"), (n.attempts += 1)));
  send(res, 200, { processed: queued.length, sent: queued.length, failed: 0 });
});
on("GET", "/api/v1/admin/outbound-webhooks", (req, res, { q }) => page(res, [...db.webhooks].reverse(), q));
on("POST", "/api/v1/admin/outbound-webhooks", (req, res, { body }) => {
  const h = { id: id(), event_type: body.event_type, url: body.url, active: body.active ?? true };
  db.webhooks.push(h);
  send(res, 200, h);
});
on("PATCH", "/api/v1/admin/outbound-webhooks/:hid", (req, res, { p, body }) => {
  const h = find(db.webhooks, p.hid);
  if (!h) return send(res, 404, { detail: "Webhook not found" });
  for (const k of ["event_type", "url", "active"])
    if (body[k] !== undefined && body[k] !== null) h[k] = body[k];
  send(res, 200, h);
});
on("DELETE", "/api/v1/admin/outbound-webhooks/:hid", (req, res, { p }) => {
  db.webhooks = db.webhooks.filter((h) => h.id !== Number(p.hid));
  send(res, 204);
});
on("GET", "/api/v1/admin/outbound-webhooks/:hid/deliveries", (req, res, { p, q }) =>
  page(res, db.webhookDeliveries.filter((d) => d.webhook_id === Number(p.hid)).reverse(), q),
);
on("POST", "/api/v1/admin/outbound-webhooks/:hid/test", (req, res, { p }) => {
  const h = find(db.webhooks, p.hid);
  if (!h) return send(res, 404, { detail: "Webhook not found" });
  const d = {
    id: id(),
    webhook_id: h.id,
    event_type: h.event_type,
    status: "delivered",
    attempts: 1,
    response_code: 200,
  };
  db.webhookDeliveries.push(d);
  send(res, 200, d);
});
on("GET", "/api/v1/admin/ml/churn", (req, res, { q }) => {
  const risk = q.get("risk");
  page(
    res,
    db.churn.filter((c) => !risk || c.risk === risk).sort((a, b) => b.score - a.score),
    q,
  );
});
on("POST", "/api/v1/admin/ml/churn/score", (req, res) => {
  db.churn.push({ account_id: 3, score: 0.12, risk: "low" });
  const by = (r) => db.churn.filter((c) => c.risk === r).length;
  send(res, 200, { scored: db.churn.length, low: by("low"), medium: by("medium"), high: by("high") });
});
on("GET", "/api/v1/admin/forecast", (req, res, { q }) => {
  const d = q.get("date") ?? today;
  const h = Number(q.get("history_days") ?? 28);
  send(res, 200, {
    for_date: d,
    history_days: h,
    plan: [
      {
        product_id: 1,
        product_name: "Full Cream Milk",
        committed_qty: 240,
        forecast_variable_qty: 36.5,
        safety_qty: 12,
        recommended_production: 288.5,
        method: "seasonal_naive",
      },
      {
        product_id: 2,
        product_name: "Masala Buttermilk",
        committed_qty: 80,
        forecast_variable_qty: 22,
        safety_qty: 8,
        recommended_production: 110,
        method: "moving_average",
      },
      {
        product_id: 3,
        product_name: "A2 Desi Ghee",
        committed_qty: 0,
        forecast_variable_qty: 4.2,
        safety_qty: 2,
        recommended_production: 6.2,
        method: "croston",
      },
    ],
  });
});
on("POST", "/api/v1/admin/ai/ask", (req, res, { body }) => {
  if (!body.message?.trim()) return send(res, 422, { detail: "message required" });
  send(res, 200, {
    answer: `Here's what I found for "${body.message}": Full Cream Milk led sales this week (₹12,400), followed by Masala Buttermilk.`,
    ai_live: false,
  });
});
on("GET", "/api/v1/invoices", (req, res, { q }) => {
  const limit = Number(q.get("limit") ?? 50);
  const offset = Number(q.get("offset") ?? 0);
  send(res, 200, [...db.invoices].reverse().slice(offset, offset + limit));
});
on("GET", "/api/v1/invoices/:iid", (req, res, { p }) => {
  const i = find(db.invoices, p.iid);
  return i ? send(res, 200, i) : send(res, 404, { detail: "Invoice not found" });
});
on("GET", "/api/v1/invoices/:iid/pdf", (req, res, { p }) => {
  const i = find(db.invoices, p.iid);
  if (!i) return send(res, 404, { detail: "Invoice not found" });
  send(res, 200, {
    invoice_no: i.invoice_no,
    pdf_url: `/files/private/invoices/${i.id}.pdf?exp=4102444800&sig=mock`,
  });
});
on("GET", "/api/v1/orders/:oid", (req, res, { p, headers }) => {
  const o = find(db.orders, p.oid);
  if (!o || (o.owner && o.owner !== headers.authorization))
    return send(res, 404, { detail: "Order not found" });
  if (o.owner) return send(res, 200, orderView(o));
  send(res, 200, {
    order_type: "one_time",
    subtotal: o.total,
    discount: 0,
    tax_total: 0,
    total_incl_tax: o.total,
    coupon_code: null,
    items: [{ product_id: 2, qty: 10, unit_price: 33, gst_rate: 5, line_total: 330 }],
    ...o,
  });
});
on("POST", "/api/v1/orders/:oid/invoice", (req, res, { p }) => {
  const o = find(db.orders, p.oid);
  if (!o) return send(res, 404, { detail: "Order not found" });
  if (!["paid", "partially_refunded", "refunded"].includes(o.payment_status))
    return send(res, 409, { detail: "Invoice is available only after the order is paid" });
  let inv = db.invoices.find((i) => i.order_id === o.id);
  if (!inv) {
    inv = {
      ...db.invoices[0],
      id: id(),
      invoice_no: `DRS/2026-27/${String(db.invoices.length + 1).padStart(4, "0")}`,
      order_id: o.id,
      account_id: o.account_id,
      total: o.total,
    };
    db.invoices.push(inv);
  }
  send(res, 200, inv);
});
const CSV = {
  orders: "id,order_no,status,total\n7,ORD-0007,created,330\n",
  payments: "id,amount,status\n1,330,success\n",
  users: "id,phone,role\n1,9876500001,admin\n",
  invoices: "id,invoice_no,total\n1,DRS/2026-27/0001,330\n",
};
on("GET", "/api/v1/admin/exports/:file", (req, res, { p }) => {
  const kind = p.file.replace(/\.csv$/, "");
  if (!CSV[kind]) return send(res, 404, { detail: "Unknown export" });
  res.writeHead(200, {
    "content-type": "text/csv",
    "content-disposition": `attachment; filename="${kind}.csv"`,
    "x-export-truncated": "false",
    "access-control-expose-headers": "X-Export-Truncated",
  });
  res.end(CSV[kind]);
});
// Signed private files (invoice PDFs): a tiny valid PDF, no bearer token (signed URL).
const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj " +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);
on("GET", "/files/.+", (req, res) => {
  res.writeHead(200, { "content-type": "application/pdf" });
  res.end(PDF);
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
  // Test control: POST /__fail {path} makes GETs of that exact path answer 503 until
  // POST /__fail {path: null} (or /__reset) — to prove failed SSR reads aren't cached.
  if (url.pathname === "/__fail") {
    failing = body.path ?? null;
    return send(res, 200, { failing });
  }
  if (failing && req.method === "GET" && url.pathname === failing)
    return send(res, 503, { detail: "mock: temporarily unavailable" });
  const isAuth = url.pathname.startsWith("/api/v1/auth/") && url.pathname !== "/api/v1/auth/me";
  const signedFile = url.pathname.startsWith("/files/");
  const publicCatalogue =
    req.method === "GET" &&
    (/^\/api\/v1\/products(\/categories|\/\d+\/(full|ratings))?$/.test(url.pathname) ||
      url.pathname === "/api/v1/shipping/serviceability" ||
      url.pathname.startsWith("/api/v1/content/") ||
      url.pathname === "/sitemap.xml");
  if (
    !isAuth &&
    !signedFile &&
    !publicCatalogue &&
    url.pathname !== "/__reset" &&
    !req.headers.authorization?.startsWith("Bearer ")
  )
    return send(res, 401, { detail: "Not authenticated" });
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = r.re.exec(url.pathname);
    if (!m) continue;
    try {
      const out = r.fn(req, res, { p: m.groups ?? {}, q: url.searchParams, body, headers: req.headers });
      if (out === NEXT) continue;
      return out;
    } catch (e) {
      return send(res, 500, { detail: String(e) });
    }
  }
  send(res, 404, { detail: `mock: no route for ${req.method} ${url.pathname}` });
}).listen(PORT, () => console.log(`mock api on :${PORT}`));
