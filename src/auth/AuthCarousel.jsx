import { useEffect, useState } from 'react'
import { colors, fontFamily } from '../theme.js'

const slides = [
  {
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1600&q=85',
    eyebrow: 'Le service commence ici',
    title: 'Chaque commande mérite son moment.',
    description: 'Gardez le rythme, la qualité et le sourire au cœur de chaque service.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=85',
    eyebrow: 'Une équipe, un même tempo',
    title: 'Du four à la table, sans perdre une seconde.',
    description: 'Retrouvez les commandes et les priorités qui font avancer la cuisine.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=1600&q=85',
    eyebrow: 'L’expérience SenYummies',
    title: 'Le goût du travail bien fait.',
    description: 'Un espace simple pour chaque rôle, pensé pour les journées qui vont vite.',
  },
]

export default function AuthCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 6500)

    return () => window.clearInterval(timer)
  }, [])

  const slide = slides[activeIndex]

  return (
    <aside className="auth-carousel" aria-label="Présentation SenYummies">
      {slides.map((item, index) => (
        <div
          className={`auth-slide-image ${index === activeIndex ? 'is-active' : ''}`}
          key={item.image}
          style={{ backgroundImage: `url(${item.image})` }}
          aria-hidden={index !== activeIndex}
        />
      ))}
      <div className="auth-carousel-overlay" />
      <div className="auth-carousel-content" style={{ fontFamily }}>
        <div className="auth-brand-mark" aria-label="SenYummies">
          SEN<span style={{ color: colors.red }}>YUMMIES</span>
        </div>
        <div className="auth-slide-copy" key={slide.title}>
          <p className="auth-eyebrow">{slide.eyebrow}</p>
          <h2>{slide.title}</h2>
          <p>{slide.description}</p>
        </div>
        <div className="auth-carousel-controls">
          <div className="auth-carousel-dots" aria-label="Sélectionner une image">
            {slides.map((item, index) => (
              <button
                aria-label={`Afficher la présentation ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={index === activeIndex ? 'is-active' : ''}
                key={item.title}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
          <span>01 / 03</span>
        </div>
      </div>
    </aside>
  )
}