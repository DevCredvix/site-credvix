import type { CSSProperties } from 'react'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import styles from './CtaButton.module.css'

/**
 * CTA baseado nas medidas do Button.svg do Figma.
 * O componente e HTML interativo (link/botao), nao uma imagem SVG.
 * Apenas o ICONE interno e renderizado por lucide-react.
 */
export type CtaButtonVariant = 'outline' | 'orange' | 'amber' | 'dark'

export interface CtaButtonColors {
  labelBackground?: string
  labelText?: string
  labelBorder?: string
  circleBackground?: string
  circleIcon?: string
}

interface CtaButtonBaseProps {
  label: string
  icon?: LucideIcon
  variant?: CtaButtonVariant
  colors?: CtaButtonColors
  /** Exibe apenas o circulo com icone; o nome acessivel permanece. */
  compact?: boolean
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export type CtaButtonProps = CtaButtonBaseProps & (
  | { to: string; href?: never; target?: never; rel?: never; type?: never; disabled?: never }
  | { href: string; to?: never; target?: string; rel?: string; type?: never; disabled?: never }
  | { to?: never; href?: never; target?: never; rel?: never; type?: 'button' | 'submit' | 'reset'; disabled?: boolean }
)

type CtaStyle = CSSProperties & {
  '--cta-label-bg'?: string
  '--cta-label-fg'?: string
  '--cta-label-border'?: string
  '--cta-circle-bg'?: string
  '--cta-circle-fg'?: string
}

export function CtaButton(props: CtaButtonProps) {
  const {
    label,
    icon: Icon = ArrowUpRight,
    variant = 'outline',
    colors,
    compact = false,
    className = '',
    ariaLabel,
    onClick,
  } = props

  const colorStyles: CtaStyle = {
    ...(colors?.labelBackground && { '--cta-label-bg': colors.labelBackground }),
    ...(colors?.labelText && { '--cta-label-fg': colors.labelText }),
    ...(colors?.labelBorder && { '--cta-label-border': colors.labelBorder }),
    ...(colors?.circleBackground && { '--cta-circle-bg': colors.circleBackground }),
    ...(colors?.circleIcon && { '--cta-circle-fg': colors.circleIcon }),
  }

  const children = (
    <>
      {!compact && <span className={styles.label}>{label}</span>}
      <span className={styles.circle} aria-hidden="true">
        <Icon size={32} strokeWidth={1.5} />
      </span>
    </>
  )

  const sharedProps = {
    className: `${styles.cta} ${className}`.trim(),
    'data-variant': variant,
    'data-compact': compact ? 'true' : undefined,
    style: colorStyles,
    'aria-label': ariaLabel ?? (compact ? label : undefined),
    onClick,
  }

  if (props.to !== undefined) {
    return <Link to={props.to} {...sharedProps}>{children}</Link>
  }

  if (props.href !== undefined) {
    return (
      <a
        href={props.href}
        target={props.target}
        rel={props.target === '_blank' ? 'noopener noreferrer' : props.rel}
        {...sharedProps}
      >
        {children}
      </a>
    )
  }

  return (
    <button type={props.type ?? 'button'} disabled={props.disabled} {...sharedProps}>
      {children}
    </button>
  )
}
