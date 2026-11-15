import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/marque.css'
import './styles/champs-mobiles.css'
import { appliquerMarque } from './config/marque.js'

// Couleur et titre de l'onglet : la marque du restaurant, avant le 1er rendu.
appliquerMarque()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
