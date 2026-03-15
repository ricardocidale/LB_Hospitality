/**
 * server/constants.ts — Named constants for server infrastructure configuration.
 *
 * Centralizes timeouts, intervals, pool sizes, and thresholds that were previously
 * scattered as magic numbers across server files. Financial constants live in
 * shared/constants.ts; this file covers operational/infrastructure values only.
 */

// ---------------------------------------------------------------------------
// External API timeouts
// ---------------------------------------------------------------------------

/** Timeout for FRED, Frankfurter, and web search API calls (ms) */
export const EXTERNAL_API_TIMEOUT_MS = 8000;

/** Timeout for AI generation calls (Anthropic, Gemini, OpenAI) (ms) */
export const AI_GENERATION_TIMEOUT_MS = 120_000;

// ---------------------------------------------------------------------------
// Database connection pool
// ---------------------------------------------------------------------------

export const DB_POOL_MAX_CONNECTIONS = 20;
export const DB_POOL_MIN_CONNECTIONS = 2;
export const DB_IDLE_TIMEOUT_MS = 60_000;
export const DB_CONNECTION_TIMEOUT_MS = 10_000;
/** Recycle connections after this many uses to prevent memory creep */
export const DB_CONNECTION_MAX_USES = 7500;

// ---------------------------------------------------------------------------
// Background task intervals
// ---------------------------------------------------------------------------

/** Market rate + FRED data refresh interval (ms) — 5 minutes */
export const MARKET_RATE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/** Expired session + rate-limit cleanup interval (ms) — 1 hour */
export const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/** Market intelligence property cache invalidation interval (ms) — 24 hours */
export const MI_CACHE_INVALIDATION_INTERVAL_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// HTTP / compression / caching
// ---------------------------------------------------------------------------

/** Minimum response size to trigger gzip compression (bytes) */
export const COMPRESSION_THRESHOLD_BYTES = 1024;

/** Cache-Control max-age for stable GET endpoints (seconds) */
export const CACHE_MAX_AGE_SECONDS = 300;

/** Cache-Control stale-while-revalidate for stable GET endpoints (seconds) */
export const CACHE_STALE_REVALIDATE_SECONDS = 600;

/** HSTS max-age header value (seconds) — 1 year */
export const HSTS_MAX_AGE_SECONDS = 31536000;

// ---------------------------------------------------------------------------
// Circuit breaker / retry defaults
// ---------------------------------------------------------------------------

export const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
export const CIRCUIT_BREAKER_WINDOW_MS = 60_000;
export const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;

export const RETRY_MAX_ATTEMPTS = 3;
export const RETRY_BASE_DELAY_MS = 200;
export const RETRY_MAX_DELAY_MS = 5_000;

// ---------------------------------------------------------------------------
// Knowledge base / RAG
// ---------------------------------------------------------------------------

/** Minimum paragraph length to include in RAG chunks (chars) */
export const KB_MIN_PARAGRAPH_LENGTH = 20;

/** Maximum title length for knowledge base entries (chars) */
export const KB_MAX_TITLE_LENGTH = 80;

/** Maximum text length sent to embedding model per input (chars) */
export const KB_EMBEDDING_MAX_LENGTH = 8000;

/** Estimated words per chunk unit for overlap calculation */
export const KB_WORDS_PER_CHUNK_ESTIMATE = 5;

/** Embedding batch size for OpenAI API calls */
export const KB_EMBEDDING_BATCH_SIZE = 20;
