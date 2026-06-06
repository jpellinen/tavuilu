import type { HTMLAttributes } from 'react'
import styles from './Card.module.css'

type Variant = 'elevated' | 'outlined' | 'flat'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
}

export function Card({ variant = 'elevated', className, children, ...props }: CardProps) {
  const classes = [styles.card, styles[variant], className].filter(Boolean).join(' ')
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}
