#!/bin/sh
# Genere la configuration du back-office a chaque demarrage du conteneur,
# depuis les variables d'environnement : la meme image sert tous les
# environnements ET tous les restaurants (marque blanche). Execute par
# l'entrypoint de l'image nginx (/docker-entrypoint.d/).
#
#   /config.js       lu par src/config/runtime.js (API, support, marque)
#   /index.html      titre de l'onglet
#   /favicon.svg     monogramme sur la couleur de marque
#   /marque/...      fichiers du restaurant (logo) montes en /marque
set -eu

HTML=/usr/share/nginx/html
MODELES=/usr/share/nginx/modeles

# Echappe \ et " pour une chaine JavaScript valide.
echapper() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}
# Texte insere dans du HTML / SVG.
echapper_html() {
  printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g' -e "s/'/\&#39;/g"
}
# Partie droite d'un s|...|...| de sed.
echapper_sed() {
  printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g'
}

# --- Marque du restaurant (valeurs par defaut : SenYummies) -----------------
NOM="${MARQUE_NOM:-SenYummies}"
COULEUR="${MARQUE_COULEUR:-#a6192e}"
case "$COULEUR" in
  \#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]) ;;
  *) echo "config-runtime: MARQUE_COULEUR invalide ($COULEUR), couleur par defaut"; COULEUR="#a6192e" ;;
esac
if [ -n "${MARQUE_INITIALES:-}" ]; then
  INITIALES="$MARQUE_INITIALES"
else
  # Majuscules du nom (SenYummies -> SY), sinon 2 premieres lettres.
  INITIALES=$(printf '%s' "$NOM" | tr -cd 'A-Z' | cut -c1-2)
  [ ${#INITIALES} -ge 2 ] || INITIALES=$(printf '%s' "$NOM" | cut -c1-2 | tr 'a-z' 'A-Z')
fi

cat > "$HTML/config.js" <<EOF
// Genere au demarrage du conteneur (docker/40-config-runtime.sh).
window.__SENYUMMIES_CONFIG__ = {
  API_BASE_URL: "$(echapper "${API_BASE_URL:-}")",
  SUPPORT_TELEPHONE: "$(echapper "${SUPPORT_TELEPHONE:-}")",
  SUPPORT_EMAIL: "$(echapper "${SUPPORT_EMAIL:-}")",
  MARQUE_NOM: "$(echapper "${MARQUE_NOM:-}")",
  MARQUE_NOM_ACCENT: "$(echapper "${MARQUE_NOM_ACCENT:-}")",
  MARQUE_INITIALES: "$(echapper "${MARQUE_INITIALES:-}")",
  MARQUE_LOGO_URL: "$(echapper "${MARQUE_LOGO_URL:-}")",
  MARQUE_ETABLISSEMENT: "$(echapper "${MARQUE_ETABLISSEMENT:-}")",
  MARQUE_COULEUR: "$(echapper "${MARQUE_COULEUR:-}")",
  MARQUE_COULEUR_CLAIRE: "$(echapper "${MARQUE_COULEUR_CLAIRE:-}")"
};
EOF

# Pages statiques : repartent toujours des modeles de l'image (redemarrage
# idempotent), le nom et la couleur par defaut y sont remplaces.
NOM_HTML=$(echapper_sed "$(echapper_html "$NOM")")
INITIALES_SVG=$(echapper_sed "$(echapper_html "$INITIALES")")
sed -e "s|SenYummies|$NOM_HTML|g" "$MODELES/index.html" > "$HTML/index.html"
sed -e "s|#a6192e|$COULEUR|g" -e "s|>SY<|>$INITIALES_SVG<|" "$MODELES/favicon.svg" > "$HTML/favicon.svg"

# Fichiers propres au restaurant (logo...), montes en lecture seule sur
# /marque : servis sous /marque/ (MARQUE_LOGO_URL=/marque/logo.png).
if [ -d /marque ]; then
  cp -R /marque/. "$HTML/marque/"
fi

echo "config-runtime: API_BASE_URL=${API_BASE_URL:-(defaut)} marque=$NOM couleur=$COULEUR"
