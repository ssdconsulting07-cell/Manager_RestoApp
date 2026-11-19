// Script de demarrage du conteneur (docker/40-config-runtime.sh) : la meme
// image applique la marque du restaurant (titre, couleur, favicon, logo).
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const racine = resolve(__dirname, '../..')

let shDisponible = true
try {
  execFileSync('sh', ['-c', 'exit 0'])
} catch {
  shDisponible = false
}

const dossiers = []
afterEach(() => dossiers.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })))

function demarrer(env, marque) {
  const base = mkdtempSync(join(tmpdir(), 'config-runtime-'))
  dossiers.push(base)
  const html = join(base, 'html')
  const modeles = join(base, 'modeles')
  mkdirSync(join(html, 'marque'), { recursive: true })
  mkdirSync(modeles, { recursive: true })
  copyFileSync(join(racine, 'index.html'), join(modeles, 'index.html'))
  copyFileSync(join(racine, 'public/favicon.svg'), join(modeles, 'favicon.svg'))
  const dossierMarque = join(base, 'marque')
  if (marque) {
    mkdirSync(dossierMarque, { recursive: true })
    Object.entries(marque).forEach(([nom, contenu]) => writeFileSync(join(dossierMarque, nom), contenu))
  }
  const copie = join(base, 'config.sh')
  writeFileSync(copie, readFileSync(join(racine, 'docker/40-config-runtime.sh'), 'utf8').replace(/\r\n/g, '\n'))
  execFileSync('sh', [copie], {
    env: { PATH: process.env.PATH, CONFIG_HTML: html, CONFIG_MODELES: modeles, CONFIG_MARQUE: dossierMarque, ...env },
  })
  const lire = (f) => readFileSync(join(html, f), 'utf8')
  const fenetre = {}
  // eslint-disable-next-line no-new-func
  new Function('window', lire('config.js'))(fenetre)
  return { lire, config: fenetre.__SENYUMMIES_CONFIG__ }
}

// sh est lent sous Windows (Git Bash) : delai large.
describe.skipIf(!shDisponible)('demarrage du conteneur (40-config-runtime.sh)', { timeout: 30000 }, () => {
  it('sans configuration : SenYummies Manager, favicon SY rouge', () => {
    const { lire } = demarrer({})
    expect(lire('index.html')).toContain('<title>SenYummies Manager</title>')
    expect(lire('favicon.svg')).toContain('>SY<')
    expect(lire('favicon.svg').toLowerCase()).toContain('#a6192e')
  })

  it('restaurant configure : titre, favicon du restaurant, logo et config.js', () => {
    const favicon = '<svg xmlns="http://www.w3.org/2000/svg"><title>KS</title></svg>'
    const { lire, config } = demarrer({
      MARQUE_NOM: 'Kër Saveurs',
      MARQUE_COULEUR: '#1F7A4D',
      MARQUE_LOGO_URL: '/marque/logo.svg',
      MARQUE_CONNEXION_IMAGES: '/marque/connexion-1.jpg',
      MARQUE_PAIEMENTS: 'wave,especes',
      MARQUE_ADRESSE: "Avenue de l'exemple, Thiès",
    }, { 'logo.svg': '<svg/>', 'favicon.svg': favicon })
    expect(lire('index.html')).toContain('<title>Kër Saveurs Manager</title>')
    expect(lire('favicon.svg')).toBe(favicon)
    expect(lire('marque/logo.svg')).toBe('<svg/>')
    expect(config.MARQUE_NOM).toBe('Kër Saveurs')
    expect(config.MARQUE_CONNEXION_IMAGES).toBe('/marque/connexion-1.jpg')
    expect(config.MARQUE_PAIEMENTS).toBe('wave,especes')
    expect(config.MARQUE_ADRESSE).toBe("Avenue de l'exemple, Thiès")
  })

  it('sans favicon fourni : monogramme aux initiales, sur la couleur du restaurant', () => {
    const { lire } = demarrer({ MARQUE_NOM: 'Kër Saveurs', MARQUE_COULEUR: '#1F7A4D' })
    expect(lire('favicon.svg')).toContain('#1F7A4D')
    expect(lire('favicon.svg')).not.toContain('>SY<')
  })
})
