/**
 * Crée les fichiers .env manquants à partir des .env.example (clone frais, Windows/macOS/Linux).
 * Utilisé par le Makefile avant docker compose (interpolation des variables à la racine).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function ensure(dst, src) {
  if (fs.existsSync(dst)) return;
  if (!fs.existsSync(src)) {
    console.warn(`[ensure-dev-env] skip ${dst}: missing template ${src}`);
    return;
  }
  fs.copyFileSync(src, dst);
  console.log(`[ensure-dev-env] created ${path.relative(root, dst)}`);
}

ensure(path.join(root, ".env"), path.join(root, ".env.example"));
ensure(
  path.join(root, "frontend", "triplydev", ".env"),
  path.join(root, "frontend", "triplydev", ".env.example")
);
ensure(path.join(root, "backend", ".env"), path.join(root, "backend", ".env.example"));
