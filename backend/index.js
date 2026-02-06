console.log('🚀🚀🚀 RUNNING INDEX.JS FILE:', __filename);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const db = require("./db");

const app = express();
console.log("✅ CARGÓ EL INDEX NUEVO CON OAUTH");
console.log("🔥 ESTA ES LA VERSION NUEVA - " + new Date().toISOString());

app.use(express.json());
app.use(cookieParser());

// ✅ Logger global
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ✅ URLs/Puertos
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5175";
let DB_NAME = process.env.DB_NAME || "";

// ============================================
// ROLES - ADMIN
// ============================================

/**
 * Lista de correos que serán ADMIN
 * Cualquier usuario que inicie sesión con uno de estos emails
 * tendrá role = "admin"
 */
const ADMIN_EMAILS = [
  "miltonernesto74663434@gmail.com",
];

// ✅ CORS FIJO (evita 5173 vs 5175)
const corsOptions = {
  origin: "http://localhost:5175",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use((req, res, next) => {
  console.log("🧩 Origin:", req.headers.origin || "(no origin)");
  next();
});

// ✅ CORS
app.use(cors(corsOptions));

// ✅ Preflight
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

const oauthClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

function authMiddleware(req, res, next) {
  const rawCookieHeader = req.headers.cookie || "";
  const token = req.cookies?.auth_token;

  console.log("🍪 Cookie header:", rawCookieHeader ? "(SI)" : "(NO)");
  console.log("🔐 auth_token cookie:", token ? "(SI)" : "(NO)");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Acceso denegado: falta auth_token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (e) {
    console.log("❌ Token inválido:", String(e));
    return res.status(401).json({
      success: false,
      message: "Acceso denegado: token inválido",
    });
  }
}

// ============================================
// ADMIN MIDDLEWARE
// ============================================

function adminMiddleware(req, res, next) {
  try {
    const role = req.user?.role || "user";

    console.log("🛡️ adminMiddleware role:", role);

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No autorizado: se requiere rol admin",
      });
    }

    return next();
  } catch (error) {
    console.error("🔥 ERROR adminMiddleware:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno validando rol",
    });
  }
}

async function getProfileFromIdToken(id_token) {
  const ticket = await oauthClient.verifyIdToken({
    idToken: id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

// ============================================
// DB CHECK AL ARRANCAR
// ============================================

(async () => {
  try {
    const [r1] = await db.execute("SELECT DATABASE() AS db");
    const currentDb = r1?.[0]?.db;
    console.log("🟩 DATABASE() ACTUAL =", currentDb);

    if (!DB_NAME) {
      DB_NAME = currentDb || "";
      console.log("🟨 DB_NAME no venía en .env, usando DATABASE() =", DB_NAME);
    } else {
      console.log("🟦 DB_NAME (ENV) =", DB_NAME);
    }

    if (DB_NAME) {
      const [r2] = await db.execute(`SHOW TABLES FROM \`${DB_NAME}\``);
      console.log(`🟩 Tablas en ${DB_NAME}:`, r2.map((x) => Object.values(x)[0]));
    }

    console.log("✅ Conectado a MySQL correctamente");
  } catch (e) {
    console.error("🟥 ERROR conectando a MySQL:", e);
  }
})();

// ============================================
// ROUTES
// ============================================

app.get("/", (req, res) => {
  res.send("✅ BACKEND OK");
});

// ✅ DEBUG: confirma que ESTE backend está respondiendo
app.get("/debug/routes", (req, res) => {
  return res.json({
    ok: true,
    file: __filename,
    now: new Date().toISOString(),
    hint: "Si ves esto, estás pegando al backend correcto (localhost:3000).",
  });
});

app.get("/debug/cookies", (req, res) => {
  console.log("🍪 DEBUG /debug/cookies");
  return res.json({
    cookieHeader: req.headers.cookie || null,
    parsedCookies: req.cookies || null,
  });
});

app.get("/auth/google/url", (req, res) => {
  const url = oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "consent",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  });

  console.log("🧷 GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI);
  console.log("🔗 URL GENERADA:", url);
  return res.json({ url });
});

// ============================================
// DB HELPERS
// ============================================

function buildUsersTableRef() {
  // ✅ Si DB_NAME está vacío por cualquier motivo, caemos a `users` sin schema
  if (!DB_NAME) return "`users`";
  return `\`${DB_NAME}\`.\`users\``;
}

function buildOrdenesTableRef() {
  if (!DB_NAME) return "`ordenes`";
  return `\`${DB_NAME}\`.\`ordenes\``;
}

async function upsertUser({ email, name, picture, googleId, provider, role }) {
  // ✅ Normalización para evitar undefined/null que rompen SQL
  const safeEmail = (email || "").trim();
  const safeName = (name || "Sin nombre").trim();
  const safePicture = picture || null;
  const safeGoogleId = googleId || null;
  const safeProvider = (provider || "google").trim();
  const safeRole = (role || "user").trim();

  const usersTable = buildUsersTableRef();

  const sql = `
    INSERT INTO ${usersTable} (email, name, picture, google_id, provider, role)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      picture = VALUES(picture),
      provider = VALUES(provider),
      role = VALUES(role)
  `;

  try {
    await db.execute(sql, [
      safeEmail,
      safeName,
      safePicture,
      safeGoogleId,
      safeProvider,
      safeRole,
    ]);
  } catch (err) {
    console.log("🟥 UPSERT FAILED");
    console.log("DB_NAME:", DB_NAME || "(VACÍO)");
    console.log("TABLE:", usersTable);
    console.log("PARAMS:", [safeEmail, safeName, safePicture, safeGoogleId, safeProvider, safeRole]);
    console.log("ERROR MESSAGE:", err?.message);
    console.log("ERROR CODE:", err?.code);
    console.log("ERROR SQLSTATE:", err?.sqlState);
    console.log("ERROR ERRNO:", err?.errno);
    throw err;
  }
}

app.get("/auth/google/callback", async (req, res) => {
  console.log("🟡 ENTRÓ A /auth/google/callback");

  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ success: false, message: "Falta code" });
    }

    const { tokens } = await oauthClient.getToken({
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    });

    if (!tokens?.id_token) {
      return res.status(500).json({ success: false, message: "No llegó id_token" });
    }

    const profile = await getProfileFromIdToken(tokens.id_token);
    console.log("🧾 PROFILE EMAIL:", profile?.email);

    const role = ADMIN_EMAILS.includes(profile.email) ? "admin" : "user";

    await upsertUser({
      email: profile.email,
      name: profile.name,
      picture: profile.picture || null,
      googleId: profile.sub,
      provider: "google",
      role,
    });

    const usersTable = buildUsersTableRef();

    const [rows] = await db.execute(
      `SELECT id, role FROM ${usersTable} WHERE email = ? LIMIT 1`,
      [profile.email]
    );

    if (!rows.length) {
      return res.status(500).json({ success: false, message: "No se pudo leer el usuario luego del upsert" });
    }

    const token = signToken({
      id: rows[0].id,
      email: profile.email,
      name: profile.name,
      role: rows[0].role,
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    console.log("🍪 Cookie seteada auth_token");
    return res.redirect(`${CLIENT_URL}/auth/callback`);
  } catch (err) {
    console.error("🔥 ERROR CALLBACK:", err?.message || err);
    return res.status(500).json({
      success: false,
      message: "Error en callback",
      error: String(err?.message || err),
    });
  }
});

// ============================================
// AUTH / USER
// ============================================

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  const usersTable = buildUsersTableRef();

  const [rows] = await db.execute(
    `SELECT id, email, name, role FROM ${usersTable} WHERE email = ? LIMIT 1`,
    [req.user.email]
  );

  res.json({ success: true, data: rows[0] || null });
});

app.get("/protected/me", authMiddleware, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  const usersTable = buildUsersTableRef();

  const [rows] = await db.execute(
    `SELECT id, email, name, role FROM ${usersTable} WHERE email = ? LIMIT 1`,
    [req.user.email]
  );

  res.json({ success: true, data: rows[0] || null });
});

// ============================================
// API: ORDENES
// ============================================

app.get("/api/ordenes", authMiddleware, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  const userId = req.user.id;

  const ordenesTable = buildOrdenesTableRef();
  const usersTable = buildUsersTableRef();

  const [rows] = await db.execute(
    `
      SELECT
        o.id_orden,
        o.fecha_orden,
        o.total,
        u.name AS nombre_completo
      FROM ${ordenesTable} o
      INNER JOIN ${usersTable} u ON u.id = o.user_id
      WHERE o.user_id = ?
      ORDER BY o.fecha_orden DESC
    `,
    [userId]
  );

  res.json({
    success: true,
    data: rows.map((r) => ({
      id_orden: r.id_orden,
      fecha_orden: r.fecha_orden,
      total: r.total,
      Usuario: { nombre_completo: r.nombre_completo },
    })),
  });
});

// ============================================
// API: USUARIOS (admin)
// ============================================

app.get("/api/usuarios", authMiddleware, adminMiddleware, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  try {
    console.log("👥 GET /api/usuarios -> admin:", req.user?.email);

    const usersTable = buildUsersTableRef();

    const [rows] = await db.execute(
      `
        SELECT
          id,
          email,
          name,
          picture,
          provider,
          role,
          created_at
        FROM ${usersTable}
        ORDER BY created_at DESC
      `
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("🔥 ERROR /api/usuarios:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Error obteniendo usuarios",
    });
  }
});

console.log("✅ Registrada ruta GET /api/usuarios");

// ============================================
// LOGOUT
// ============================================

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("auth_token", { path: "/" });
  res.json({ success: true });
});

// ============================================
// START SERVER
// ============================================

app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT || 3000}`);
  console.log("CLIENT_URL:", CLIENT_URL);
  console.log("GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI);
});
