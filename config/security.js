// config/security.js
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import cors from "cors";

// Content Security Policy configuration
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    scriptSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
};

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins =
      process.env.allowedorigin
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
  maxAge: 86400, // 24 hours
};

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: {
      error: "Too many requests",
      message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => req.ip || req.connection?.remoteAddress,
  });

/**
 * Speed limiting configuration (express-slow-down v2)
 * - In tests, we noop to avoid noise and flakiness.
 * - For v2, use a function for delayMs or explicitly validate to suppress warning.
 */
const createSpeedLimit = (windowMs, delayAfter, fixedDelayMs) => {
  if (process.env.NODE_ENV === "test") {
    // No-op middleware in test runs
    return (req, _res, next) => next();
  }

  return slowDown({
    windowMs,
    // v2 still accepts delayAfter; library also exposes req.slowDown.limit internally.
    delayAfter,
    // New behavior: a constant delay applied after delayAfter is exceeded.
    // If you prefer the old linear backoff, see the commented block below.
    delayMs: () => fixedDelayMs,

    // Cap the delay to something sane
    maxDelayMs: 20000,

    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => req.ip || req.connection?.remoteAddress,

    // Optional: silence the deprecation warning explicitly
    validate: { delayMs: false },
  });

  /*  // If you prefer the OLD behavior (linear growth), use this instead:
  return slowDown({
    windowMs,
    delayAfter,
    delayMs: (used, req) => {
      const limit = req.slowDown.limit; // internal value
      const over = Math.max(0, used - limit);
      return Math.min(over * fixedDelayMs, 20000);
    },
    maxDelayMs: 20000,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => req.ip || req.connection?.remoteAddress,
    validate: { delayMs: false },
  });
  */
};

// Security middleware configuration
const securityConfig = {
  // General rate limiting
  generalLimiter: createRateLimit(
    15 * 60 * 1000,
    100,
    "Too many requests from this IP"
  ),

  // Strict rate limiting for auth endpoints
  authLimiter: createRateLimit(
    15 * 60 * 1000,
    5,
    "Too many authentication attempts"
  ),

  // Speed limiting
  // (windowMs, delayAfter, fixedDelayMs)
  speedLimiter: createSpeedLimit(15 * 60 * 1000, 50, 500),

  // Helmet configuration
  helmetConfig: {
    contentSecurityPolicy: cspConfig,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // xssFilter: true, // ❌ deprecated in helmet; remove to avoid warnings
  },
};

export { corsOptions, securityConfig };
