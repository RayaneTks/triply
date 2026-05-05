/**
 * Crée les .env manquants à partir des .env.example (clone frais, multi-OS)
 * et synchronise les clés DB_* du .env racine vers backend/.env pour que
 * Postgres (interpolé via Compose) et Laravel utilisent toujours les mêmes
 * identifiants, même après modification d'un seul fichier.
 *
 * Idempotent : ré-exécutable, n'écrase pas les autres clés.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const ROOT_ENV = path.join(root, ".env");
const ROOT_TEMPLATE = path.join(root, ".env.example");
const BACKEND_ENV = path.join(root, "backend", ".env");
const BACKEND_TEMPLATE = path.join(root, "backend", ".env.example");

const SYNCED_DB_KEYS = ["DB_DATABASE", "DB_USERNAME", "DB_PASSWORD"];

function rel(p) {
    return path.relative(root, p);
}

function ensure(dst, src) {
    if (fs.existsSync(dst)) return;
    if (!fs.existsSync(src)) {
        console.warn(`[ensure-dev-env] skip ${rel(dst)}: missing template ${rel(src)}`);
        return;
    }
    fs.copyFileSync(src, dst);
    console.log(`[ensure-dev-env] created ${rel(dst)}`);
}

function parseEnv(file) {
    if (!fs.existsSync(file)) return {};
    const text = fs.readFileSync(file, "utf8");
    const out = {};
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq <= 0) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        out[key] = value;
    }
    return out;
}

function upsertKey(file, key, value) {
    const original = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    const eol = original.includes("\r\n") ? "\r\n" : "\n";
    const re = new RegExp(`^${key}=.*$`, "m");
    let next;
    if (re.test(original)) {
        next = original.replace(re, `${key}=${value}`);
    } else {
        const trimmed = original.replace(/[\r\n]+$/, "");
        next = (trimmed ? trimmed + eol : "") + `${key}=${value}` + eol;
    }
    if (next !== original) {
        fs.writeFileSync(file, next);
        return true;
    }
    return false;
}

function syncDbKeys() {
    if (!fs.existsSync(ROOT_ENV) || !fs.existsSync(BACKEND_ENV)) return;
    const rootValues = parseEnv(ROOT_ENV);
    let touched = 0;
    for (const key of SYNCED_DB_KEYS) {
        const value = rootValues[key];
        if (value === undefined || value === "") continue;
        if (upsertKey(BACKEND_ENV, key, value)) touched += 1;
    }
    if (touched > 0) {
        console.log(`[ensure-dev-env] synced ${touched} DB key(s) into ${rel(BACKEND_ENV)}`);
    }
}

ensure(ROOT_ENV, ROOT_TEMPLATE);
ensure(BACKEND_ENV, BACKEND_TEMPLATE);
syncDbKeys();
