#!/bin/sh
# Genere /config.js a chaque demarrage du conteneur, depuis les variables
# d'environnement : la meme image sert tous les environnements. Lu par
# src/config/runtime.js. Execute par l'entrypoint de l'image nginx
# (/docker-entrypoint.d/).
set -eu

CIBLE=/usr/share/nginx/html/config.js

# Echappe \ et " pour produire une chaine JavaScript valide.
echapper() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

{
  echo "// Genere au demarrage du conteneur (docker/40-config-runtime.sh)."
  echo "window.__SENYUMMIES_CONFIG__ = {"
  echo "  API_BASE_URL: \"$(echapper "${API_BASE_URL:-}")\","
  echo "  SUPPORT_TELEPHONE: \"$(echapper "${SUPPORT_TELEPHONE:-}")\","
  echo "  SUPPORT_EMAIL: \"$(echapper "${SUPPORT_EMAIL:-}")\""
  echo "};"
} > "$CIBLE"

echo "config-runtime: API_BASE_URL=${API_BASE_URL:-(defaut)}"
