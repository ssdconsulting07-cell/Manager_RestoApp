import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import StatusBadge from '../../components/crud/StatusBadge.jsx'
import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ROLE_LABELS, ROLES } from '../../auth/roles.js'
import { defaultCountries, FlagImage, parseCountry } from 'react-international-phone'
import 'react-international-phone/style.css'

const FILTER_DEFS = [
  { key: 'TOUS', label: 'Tous', icon: 'fa-users', accent: '#17365d', accentBg: '#e5edf5' },
  { key: 'ACTIFS', label: 'Actifs', icon: 'fa-circle-check', accent: '#1f6f57', accentBg: '#e2f2ec' },
  { key: 'INACTIFS', label: 'Désactivés', icon: 'fa-user-slash', accent: '#5b5b5f', accentBg: '#ececea' },
]
const ROWS_OPTIONS = [5, 10, 25]
const ASSIGNABLE_ROLES = ROLES.filter((role) => role !== 'MANAGER')

function displayName(user) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
}

const COUNTRY_NAMES = new Intl.DisplayNames(['fr'], { type: 'region' })
const PHONE_COUNTRIES = defaultCountries
  .map(parseCountry)
  .map((country) => ({
    ...country,
    displayName: COUNTRY_NAMES.of(country.iso2.toUpperCase()) || country.name,
  }))
  .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'))

function getPhoneCountryAndNationalNumber(value) {
  const digits = (value || '').replace(/\D/g, '')
  const matchingCountry = [...PHONE_COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => digits.startsWith(country.dialCode))

  if (!matchingCountry) return { countryIso2: 'sn', nationalNumber: digits }
  return {
    countryIso2: matchingCountry.iso2,
    nationalNumber: digits.slice(matchingCountry.dialCode.length),
  }
}

function StaffPhoneFields({ value, onChange }) {
  const initialPhone = useMemo(() => getPhoneCountryAndNationalNumber(value), [])
  const [countryIso2, setCountryIso2] = useState(initialPhone.countryIso2)
  const [countrySearch, setCountrySearch] = useState('')
  const [countryMenuOpen, setCountryMenuOpen] = useState(false)
  const countryMenuRef = useRef(null)
  const country = PHONE_COUNTRIES.find((item) => item.iso2 === countryIso2) || PHONE_COUNTRIES.find((item) => item.iso2 === 'sn')
  const digits = (value || '').replace(/\D/g, '')
  const nationalNumber = digits.startsWith(country.dialCode) ? digits.slice(country.dialCode.length) : digits
  const filteredCountries = PHONE_COUNTRIES.filter((item) => (
    `${item.displayName} ${item.iso2} +${item.dialCode}`.toLowerCase().includes(countrySearch.trim().toLowerCase())
  ))

  useEffect(() => {
    if (!countryMenuOpen) return undefined
    function closeOnOutsideClick(event) {
      if (!countryMenuRef.current?.contains(event.target)) {
        setCountryMenuOpen(false)
        setCountrySearch('')
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [countryMenuOpen])

  function selectCountry(nextCountry) {
    setCountryIso2(nextCountry.iso2)
    setCountryMenuOpen(false)
    setCountrySearch('')
    onChange(nationalNumber ? `+${nextCountry.dialCode}${nationalNumber}` : '')
  }

  function updateNationalNumber(event) {
    const nextNumber = event.target.value.replace(/\D/g, '')
    onChange(nextNumber ? `+${country.dialCode}${nextNumber}` : '')
  }

  return (
    <fieldset className="staff-phone-group staff-user-form-wide">
      <legend>Téléphone</legend>
      <div className="staff-phone-fields">
        <div className="staff-phone-country" ref={countryMenuRef}>
          <span className="staff-phone-label">Indicatif</span>
          <button
            className="staff-phone-country-trigger"
            type="button"
            aria-label={`Pays : ${country.displayName}, indicatif +${country.dialCode}`}
            aria-haspopup="listbox"
            aria-expanded={countryMenuOpen}
            onClick={() => setCountryMenuOpen((open) => !open)}
          >
            <FlagImage iso2={country.iso2} size="22px" />
            <span>+{country.dialCode}</span>
            <i className={`fa-solid ${countryMenuOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
          </button>
          {countryMenuOpen && (
            <div className="staff-phone-country-menu">
              <label className="staff-phone-country-search">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Rechercher un pays"
                  placeholder="Rechercher un pays…"
                  value={countrySearch}
                  onChange={(event) => setCountrySearch(event.target.value)}
                  autoFocus
                />
              </label>
              <ul role="listbox" aria-label="Pays et indicatifs">
                {filteredCountries.map((item) => (
                  <li key={item.iso2}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={item.iso2 === countryIso2}
                      onClick={() => selectCountry(item)}
                    >
                      <FlagImage iso2={item.iso2} size="20px" />
                      <span>{item.displayName}</span>
                      <span className="staff-phone-country-code">+{item.dialCode}</span>
                    </button>
                  </li>
                ))}
                {filteredCountries.length === 0 && <li className="staff-phone-country-empty">Aucun pays trouvé.</li>}
              </ul>
            </div>
          )}
        </div>
        <label className="staff-phone-number">
          Téléphone
          <input type="tel" inputMode="numeric" value={nationalNumber} onChange={updateNationalNumber} maxLength={20} required />
        </label>
      </div>
    </fieldset>
  )
}

function StaffUserFormModal({ user, currentUsername, onSave, onClose }) {
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [address, setAddress] = useState(user?.address || '')
  const [cni, setCni] = useState(user?.cni || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [username, setUsername] = useState(user?.username || '')
  const [role, setRole] = useState(user?.role || 'GERANT')
  const [active, setActive] = useState(user?.active ?? true)

  function submit(event) {
    event.preventDefault()
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      address: address.trim(),
      cni: cni.trim(),
      phone: phone.trim(),
      username: username.trim(),
      role,
      active,
    })
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="manager-modal manager-modal-wide" role="dialog" aria-modal="true" aria-labelledby="staff-user-form-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Gestion du personnel</p>
            <h2 id="staff-user-form-title">{user ? 'Modifier le compte' : 'Créer un compte'}</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <form className="manager-modal-form staff-user-form" onSubmit={submit}>
          <label>
            Prénom
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={80} autoFocus required />
          </label>
          <label>
            Nom
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={80} required />
          </label>
          <label className="staff-user-form-wide">
            Adresse
            <textarea value={address} onChange={(event) => setAddress(event.target.value)} maxLength={240} rows={2} required />
          </label>
          <label>
            CNI
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{14}"
              title="La CNI doit contenir exactement 14 chiffres."
              value={cni}
              onChange={(event) => setCni(event.target.value.replace(/\D/g, '').slice(0, 14))}
              minLength={14}
              maxLength={14}
              required
            />
          </label>
          <StaffPhoneFields value={phone} onChange={setPhone} />
          <label>
            Identifiant
            <input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={80} required disabled={user?.username === currentUsername} />
          </label>
          <label>
            Rôle
            <select value={role} onChange={(event) => setRole(event.target.value)} required disabled={user?.username === currentUsername}>
              {ASSIGNABLE_ROLES.map((value) => <option key={value} value={value}>{ROLE_LABELS[value]}</option>)}
            </select>
          </label>
          {user && (
            <label className="staff-user-active-toggle staff-user-form-wide">
              <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} disabled={user?.username === currentUsername} />
              Compte actif
            </label>
          )}
          <div className="manager-modal-actions staff-user-form-wide">
            <button className="manager-button manager-button-quiet" type="button" onClick={onClose}>Annuler</button>
            <button className="manager-button manager-button-primary" type="submit">{user ? 'Enregistrer' : 'Créer le compte'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function TemporaryPasswordModal({ credentials, onClose, onCopied }) {
  const [copyFailed, setCopyFailed] = useState(false)

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(credentials.temporaryPassword)
      onCopied()
    } catch {
      setCopyFailed(true)
    }
  }

  return (
    <div className="manager-modal-backdrop" role="presentation">
      <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="temporary-password-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">À transmettre au membre du personnel</p>
            <h2 id="temporary-password-title">Mot de passe temporaire</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer sans perdre le mot de passe" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <p className="staff-user-password-copy">
          {credentials.user.username} devra choisir un nouveau mot de passe et le confirmer avant d’accéder à son espace.
        </p>
        <div className="staff-user-password-value" aria-label="Mot de passe temporaire">
          {credentials.temporaryPassword}
        </div>
        {copyFailed && <p className="auth-field-help">Copie automatique indisponible. Sélectionnez le mot de passe pour le copier.</p>}
        <div className="manager-modal-actions">
          <button className="manager-button manager-button-quiet" type="button" onClick={copyPassword}>
            <i className="fa-solid fa-copy" aria-hidden="true" /> Copier
          </button>
          <button className="manager-button manager-button-primary" type="button" onClick={onClose}>Fermer</button>
        </div>
      </section>
    </div>
  )
}

function StaffUserDetailModal({ user, onClose }) {
  const name = displayName(user)
  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="staff-user-detail-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Fiche utilisateur</p>
            <h2 id="staff-user-detail-title">{name}</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <dl className="staff-user-details">
          <div><dt>Identifiant</dt><dd>{user.username}</dd></div>
          <div><dt>Rôle</dt><dd>{ROLE_LABELS[user.role]}</dd></div>
          <div><dt>Téléphone</dt><dd>{user.phone || '—'}</dd></div>
          <div><dt>CNI</dt><dd>{user.cni || '—'}</dd></div>
          <div className="staff-user-detail-wide"><dt>Adresse</dt><dd>{user.address || '—'}</dd></div>
          <div><dt>Statut</dt><dd>{user.active ? 'Actif' : 'Désactivé'}</dd></div>
        </dl>
        <div className="manager-modal-actions">
          <button className="manager-button manager-button-primary" type="button" onClick={onClose}>Fermer</button>
        </div>
      </section>
    </div>
  )
}

export default function Personnel() {
  const { username: currentUsername } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)
  const [temporaryCredentials, setTemporaryCredentials] = useState(null)
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false)
  const [filter, setFilter] = useState('TOUS')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(10)

  async function loadUsers() {
    setError(null)
    try {
      setUsers(await apiGet('/staff-users'))
    } catch (requestError) {
      setError(requestError.message || 'Impossible de charger les comptes du personnel.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  function notify(type, message) {
    setToast({ id: Date.now(), type, message })
  }

  const counts = useMemo(() => ({
    TOUS: users.length,
    ACTIFS: users.filter((user) => user.active).length,
    INACTIFS: users.filter((user) => !user.active).length,
  }), [users])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      if (filter === 'ACTIFS' && !user.active) return false
      if (filter === 'INACTIFS' && user.active) return false
      const searchable = [user.firstName, user.lastName, user.username, user.cni, user.phone, ROLE_LABELS[user.role]]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return !query || searchable.includes(query)
    })
  }, [users, filter, search])
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / rows))
  const visibleUsers = filteredUsers.slice((page - 1) * rows, page * rows)

  async function handleSaveUser(data) {
    try {
      if (modal.user) {
        await apiPatch(`/staff-users/${modal.user.id}`, data)
        notify('success', `Compte « ${data.firstName} ${data.lastName} » mis à jour.`)
      } else {
        const createData = {
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          cni: data.cni,
          phone: data.phone,
          username: data.username,
          role: data.role,
        }
        const credentials = await apiPost('/staff-users', createData)
        setTemporaryCredentials(credentials)
        setShowTemporaryPassword(true)
        notify('success', `Compte « ${data.firstName} ${data.lastName} » créé.`)
      }
      setModal(null)
      await loadUsers()
    } catch (requestError) {
      notify('error', requestError.message || 'Impossible d’enregistrer ce compte.')
    }
  }

  async function handleRegeneratePassword(user) {
    try {
      const credentials = await apiPost(`/staff-users/${user.id}/temporary-password`)
      setModal(null)
      setTemporaryCredentials(credentials)
      setShowTemporaryPassword(true)
      notify('success', `Nouveau mot de passe temporaire généré pour « ${user.username} ».`)
      await loadUsers()
    } catch (requestError) {
      setModal(null)
      notify('error', requestError.message || 'Impossible de régénérer ce mot de passe.')
    }
  }

  async function handleDeactivate(user) {
    try {
      await apiDelete(`/staff-users/${user.id}`)
      setModal(null)
      notify('success', `Compte « ${user.username} » désactivé.`)
      await loadUsers()
    } catch (requestError) {
      setModal(null)
      notify('error', requestError.message || 'Impossible de désactiver ce compte.')
    }
  }

  async function handleActivate(user) {
    try {
      await apiPatch(`/staff-users/${user.id}`, {
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        cni: user.cni,
        phone: user.phone,
        username: user.username,
        role: user.role,
        active: true,
      })
      notify('success', `Compte « ${user.username} » activé.`)
      await loadUsers()
    } catch (requestError) {
      notify('error', requestError.message || 'Impossible d’activer ce compte.')
    }
  }

  async function handleDeletePermanently(user) {
    try {
      await apiDelete(`/staff-users/${user.id}/permanent`)
      setModal(null)
      notify('success', `Compte « ${displayName(user)} » supprimé définitivement.`)
      await loadUsers()
    } catch (requestError) {
      setModal(null)
      notify('error', requestError.message || 'Impossible de supprimer définitivement ce compte.')
    }
  }

  function changeFilter(nextFilter) {
    setFilter(nextFilter)
    setPage(1)
  }

  function changeSearch(value) {
    setSearch(value)
    setPage(1)
  }

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Utilisateurs</h1>
          <p>Gérez les accès, les rôles et les mots de passe du personnel.</p>
        </div>
      </section>

      <section>
        <StatFilterCards
          items={FILTER_DEFS.map((item) => ({ ...item, value: counts[item.key] }))}
          selected={filter}
          onSelect={changeFilter}
        />

        <div className="crud-toolbar">
          <div className="crud-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              placeholder="Rechercher un nom, identifiant ou rôle…"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
            />
          </div>
          <span className="crud-toolbar-spacer" />
          <button className="crud-add-button" type="button" onClick={() => setModal({ kind: 'form', user: null })}>
            <i className="fa-solid fa-user-plus" aria-hidden="true" /> Créer un compte
          </button>
        </div>

        {error && <p className="staff-users-error" role="alert">{error}</p>}
        {loading ? (
          <p className="crud-empty">Chargement des comptes…</p>
        ) : filteredUsers.length === 0 ? (
          <p className="crud-empty">Aucun membre du personnel correspondant.</p>
        ) : (
          <div className="staff-users-table-wrap">
            <table className="staff-users-table">
              <thead>
                <tr><th>Nom</th><th>Identifiant</th><th>Rôle</th><th>Téléphone</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{displayName(user)}</strong>{user.username === currentUsername && <span className="staff-users-self">Vous</span>}</td>
                    <td>{user.username}</td>
                    <td>{ROLE_LABELS[user.role]}</td>
                    <td>{user.phone || '—'}</td>
                    <td><StatusBadge statut={user.active ? 'ACTIF' : 'ARCHIVE'} label={user.active ? 'Actif' : 'Désactivé'} /></td>
                    
                    <td>
                      <div className="staff-users-actions">
                        <button className="crud-action is-accent-green" type="button" onClick={() => setModal({ kind: 'detail', user })}>
                          <i className="fa-solid fa-eye" aria-hidden="true" /> Détail
                        </button>
                        {user.role === 'MANAGER' ? (
                          <span className="staff-users-protected"><i className="fa-solid fa-lock" aria-hidden="true" /> Compte unique protégé</span>
                        ) : (
                          <>
                            <button className="crud-action" type="button" onClick={() => setModal({ kind: 'form', user })}>
                              <i className="fa-solid fa-pen" aria-hidden="true" /> Modifier
                            </button>
                            {user.mustChangePassword && temporaryCredentials?.user.id === user.id && (
                              <button className="crud-action is-accent-yellow" type="button" onClick={() => setShowTemporaryPassword(true)}>
                                <i className="fa-solid fa-eye" aria-hidden="true" /> Réafficher le temporaire
                              </button>
                            )}
                            {user.active && (
                              <button className="crud-action is-accent-yellow" type="button" disabled={user.username === currentUsername} onClick={() => setModal({ kind: 'regenerate', user })}>
                                <i className="fa-solid fa-key" aria-hidden="true" /> Régénérer password
                              </button>
                            )}
                            {user.active ? (
                              <button
                                className="crud-action is-danger"
                                type="button"
                                disabled={user.username === currentUsername}
                                onClick={() => setModal({ kind: 'deactivate', user })}
                              >
                                <i className="fa-solid fa-user-slash" aria-hidden="true" /> Désactiver
                              </button>
                            ) : (
                              <>
                                <button className="crud-action is-accent-green" type="button" onClick={() => handleActivate(user)}>
                                  <i className="fa-solid fa-user-check" aria-hidden="true" /> Activer
                                </button>
                                <button className="crud-action is-danger" type="button" onClick={() => setModal({ kind: 'delete', user })}>
                                  <i className="fa-solid fa-trash" aria-hidden="true" /> Supprimer définitivement
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          pageCount={pageCount}
          rowsPerPage={rows}
          totalItems={filteredUsers.length}
          onPageChange={setPage}
          onRowsPerPageChange={(nextRows) => { setRows(nextRows); setPage(1) }}
          rowsOptions={ROWS_OPTIONS}
        />
      </section>

      {modal?.kind === 'form' && (
        <StaffUserFormModal user={modal.user} currentUsername={currentUsername} onSave={handleSaveUser} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'detail' && (
        <StaffUserDetailModal user={modal.user} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'deactivate' && (
        <ConfirmModal
          title="Désactiver ce compte ?"
          message={`« ${modal.user.username} » ne pourra plus se connecter. Son historique sera conservé et le compte pourra être réactivé.`}
          confirmLabel="Désactiver"
          tone="danger"
          icon="fa-user-slash"
          onConfirm={() => handleDeactivate(modal.user)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'regenerate' && (
        <ConfirmModal
          title="Régénérer ce mot de passe ?"
          message={`Le mot de passe de « ${modal.user.username} » sera remplacé. Son prochain accès nécessitera un nouveau mot de passe temporaire.`}
          confirmLabel="Régénérer"
          tone="warning"
          icon="fa-key"
          onConfirm={() => handleRegeneratePassword(modal.user)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === 'delete' && (
        <ConfirmModal
          title="Supprimer définitivement ce compte ?"
          message={`Le compte désactivé de « ${displayName(modal.user)} » et ses informations seront supprimés sans possibilité de restauration.`}
          confirmLabel="Supprimer définitivement"
          tone="danger"
          icon="fa-trash"
          onConfirm={() => handleDeletePermanently(modal.user)}
          onCancel={() => setModal(null)}
        />
      )}
      {temporaryCredentials && showTemporaryPassword && (
        <TemporaryPasswordModal
          credentials={temporaryCredentials}
          onClose={() => setShowTemporaryPassword(false)}
          onCopied={() => notify('success', 'Mot de passe temporaire copié.')}
        />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}