import { useMemo } from 'react'
import { motion } from 'motion/react'
import styles from './Confetti.module.css'

const PARTICLE_COLORS = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-warning)',
]

const PARTICLE_COUNT = 18

interface Particle {
  color: string
  x: number
  y: number
  rotate: number
  delay: number
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4
    const distance = 70 + Math.random() * 50
    return {
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotate: Math.random() * 360 - 180,
      delay: Math.random() * 0.1,
    }
  })
}

export function Confetti() {
  const particles = useMemo(() => createParticles(), [])

  return (
    <div className={styles.burst} aria-hidden="true" data-testid="confetti-burst">
      {particles.map((particle, i) => (
        <motion.span
          key={i}
          className={styles.particle}
          style={{ backgroundColor: particle.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: 0,
            rotate: particle.rotate,
            scale: 0.6,
          }}
          transition={{ duration: 0.8, delay: particle.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
