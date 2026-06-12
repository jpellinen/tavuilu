import { useMemo } from 'react'
import { motion } from 'motion/react'
import styles from './Confetti.module.css'

const PARTICLE_COLORS = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-warning)',
]

const PARTICLE_COUNT = 80

interface Particle {
  color: string
  left: number
  width: number
  height: number
  rotateStart: number
  rotateEnd: number
  drift: number
  duration: number
  delay: number
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const left = (i / PARTICLE_COUNT) * 100 + (Math.random() * 4 - 2)
    return {
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      left,
      width: 12 + Math.random() * 10,
      height: 18 + Math.random() * 14,
      rotateStart: Math.random() * 360,
      rotateEnd: Math.random() * 360 + 360,
      drift: Math.random() * 140 - 70,
      duration: 1.6 + Math.random() * 1,
      delay: Math.random() * 0.8,
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
          style={{
            backgroundColor: particle.color,
            left: `${particle.left}%`,
            width: particle.width,
            height: particle.height,
          }}
          initial={{ y: '-15vh', x: 0, opacity: 1, rotate: particle.rotateStart }}
          animate={{
            y: '115vh',
            x: particle.drift,
            opacity: [1, 1, 0],
            rotate: particle.rotateEnd,
          }}
          transition={{ duration: particle.duration, delay: particle.delay, ease: 'linear' }}
        />
      ))}
    </div>
  )
}
