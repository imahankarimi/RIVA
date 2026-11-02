import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import styles from './GlassSelect.module.css'

export interface GlassSelectOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

export interface GlassSelectProps {
  /** Visible field label. Omit for compact controls (use aria-label). */
  label?: string
  value: string
  options: GlassSelectOption[]
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  id?: string
  /** Accessible name when `label` is omitted. */
  'aria-label'?: string
  /** Visual density / shape. */
  size?: 'default' | 'compact' | 'pill'
  /** Prefer opening upward when space is tight (still auto-flips if needed). */
  placement?: 'bottom' | 'top'
  /** Stretch trigger to container width (default true). */
  fullWidth?: boolean
}

interface MenuCoords {
  /** Distance from viewport top when opening downward; omitted when openUp. */
  top?: number
  /** Distance from viewport bottom when opening upward; omitted when openDown. */
  bottom?: number
  left: number
  width: number
  openUp: boolean
  maxHeight: number
}

const MENU_GAP = 6
const MENU_VIEWPORT_PAD = 8
const MENU_MAX_HEIGHT = 280
const OPTION_ROW_ESTIMATE = 44

function estimateMenuHeight(optionCount: number): number {
  return Math.min(optionCount * OPTION_ROW_ESTIMATE + 16, MENU_MAX_HEIGHT)
}

function measureMenuCoords(
  trigger: HTMLElement,
  optionCount: number,
  preferred: 'bottom' | 'top',
): MenuCoords {
  const rect = trigger.getBoundingClientRect()
  const menuHeight = estimateMenuHeight(optionCount)
  const spaceBelow = window.innerHeight - rect.bottom - MENU_VIEWPORT_PAD
  const spaceAbove = rect.top - MENU_VIEWPORT_PAD

  let openUp: boolean
  if (preferred === 'top') {
    openUp = spaceAbove >= menuHeight || spaceAbove > spaceBelow
  } else {
    openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow
  }

  const available = openUp ? spaceAbove : spaceBelow
  const maxHeight = Math.max(120, Math.min(MENU_MAX_HEIGHT, available - MENU_GAP))
  const width = Math.max(rect.width, 120)

  // Keep the menu fully inside the viewport horizontally.
  const maxLeft = Math.max(MENU_VIEWPORT_PAD, window.innerWidth - width - MENU_VIEWPORT_PAD)
  const left = Math.min(Math.max(rect.left, MENU_VIEWPORT_PAD), maxLeft)

  if (openUp) {
    // Anchor the menu's bottom edge just above the trigger so short lists
    // hug the control instead of hanging from a maxHeight-sized top offset.
    return {
      bottom: Math.max(MENU_VIEWPORT_PAD, window.innerHeight - rect.top + MENU_GAP),
      left,
      width,
      openUp: true,
      maxHeight,
    }
  }

  return {
    top: Math.min(rect.bottom + MENU_GAP, window.innerHeight - MENU_VIEWPORT_PAD - 40),
    left,
    width,
    openUp: false,
    maxHeight,
  }
}

export function GlassSelect({
  label,
  value,
  options,
  onChange,
  className = '',
  disabled = false,
  id,
  'aria-label': ariaLabel,
  size = 'default',
  placement = 'bottom',
  fullWidth = true,
}: GlassSelectProps) {
  const reactId = useId()
  const listboxId = `${reactId}-listbox`
  const labelId = label ? `${reactId}-label` : undefined
  const triggerId = id ?? `${reactId}-trigger`

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const [coords, setCoords] = useState<MenuCoords | null>(null)

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  )

  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  const enabledIndexes = useMemo(
    () =>
      options
        .map((option, index) => (option.disabled ? -1 : index))
        .filter((index) => index >= 0),
    [options],
  )

  const updateCoords = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    setCoords(measureMenuCoords(trigger, options.length, placement))
  }, [options.length, placement])

  const close = useCallback(() => {
    setOpen(false)
    setHighlight(-1)
  }, [])

  const openMenu = useCallback(() => {
    if (disabled || options.length === 0) return
    updateCoords()
    const start =
      selectedIndex >= 0 && !options[selectedIndex]?.disabled
        ? selectedIndex
        : (enabledIndexes[0] ?? -1)
    setHighlight(start)
    setOpen(true)
  }, [disabled, enabledIndexes, options, selectedIndex, updateCoords])

  const toggle = useCallback(() => {
    if (open) close()
    else openMenu()
  }, [close, open, openMenu])

  const commit = useCallback(
    (index: number) => {
      const option = options[index]
      if (!option || option.disabled) return
      onChange(option.value)
      close()
      // Return focus to trigger after selection
      requestAnimationFrame(() => {
        document.getElementById(triggerId)?.focus()
      })
    },
    [close, onChange, options, triggerId],
  )

  const moveHighlight = useCallback(
    (delta: number) => {
      if (enabledIndexes.length === 0) return
      setHighlight((current) => {
        const pos = enabledIndexes.indexOf(current)
        const nextPos =
          pos === -1
            ? delta > 0
              ? 0
              : enabledIndexes.length - 1
            : (pos + delta + enabledIndexes.length) % enabledIndexes.length
        return enabledIndexes[nextPos] ?? enabledIndexes[0]
      })
    },
    [enabledIndexes],
  )

  // Keep the floating menu glued to the trigger while open (scroll / resize / layout).
  useLayoutEffect(() => {
    if (!open) return
    updateCoords()
  }, [open, updateCoords, options.length, value])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      close()
    }

    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        document.getElementById(triggerId)?.focus()
      }
    }

    function onViewportChange() {
      updateCoords()
    }

    // pointerdown (not mousedown) so we dismiss before parent click handlers race.
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onViewportChange)
    // Capture scroll from any ancestor so nested overflow containers re-position the menu.
    window.addEventListener('scroll', onViewportChange, true)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [close, open, triggerId, updateCoords])

  useEffect(() => {
    if (!open || highlight < 0) return
    const item = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (disabled) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) openMenu()
        else moveHighlight(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!open) openMenu()
        else moveHighlight(-1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!open) openMenu()
        else if (highlight >= 0) commit(highlight)
        break
      case 'Home':
        if (open && enabledIndexes.length) {
          event.preventDefault()
          setHighlight(enabledIndexes[0])
        }
        break
      case 'End':
        if (open && enabledIndexes.length) {
          event.preventDefault()
          setHighlight(enabledIndexes[enabledIndexes.length - 1])
        }
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          close()
        }
        break
      default:
        break
    }
  }

  const rootClass = [
    styles.root,
    fullWidth ? styles.fullWidth : styles.autoWidth,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const triggerClass = [
    styles.trigger,
    styles[size],
    'glass-lens',
    open ? styles.triggerOpen : '',
    disabled ? styles.triggerDisabled : '',
  ]
    .filter(Boolean)
    .join(' ')

  const menuClass = [
    styles.menu,
    coords?.openUp ? styles.menuUp : styles.menuDown,
    open && coords ? styles.menuOpen : '',
  ]
    .filter(Boolean)
    .join(' ')

  const menuStyle: CSSProperties | undefined = coords
    ? {
        top: coords.openUp ? 'auto' : coords.top,
        bottom: coords.openUp ? coords.bottom : 'auto',
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight,
      }
    : undefined

  const menu = (
    <ul
      ref={listRef}
      id={listboxId}
      className={menuClass}
      style={menuStyle}
      role="listbox"
      data-glass-select-menu=""
      aria-labelledby={labelId}
      aria-activedescendant={highlight >= 0 ? `${reactId}-opt-${highlight}` : undefined}
      // Keep in the DOM while open so portal positioning can settle; hide via CSS when closed.
      hidden={!open}
      onPointerDown={(event) => {
        // Portaled menus are outside parent popovers; stop bubble so nested
        // "click outside" handlers (e.g. mobile account menu) do not dismiss
        // before the option click can commit.
        event.stopPropagation()
      }}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value
        const isActive = index === highlight

        const optionClass = [
          styles.option,
          isSelected ? styles.optionSelected : '',
          isActive ? styles.optionActive : '',
          option.disabled ? styles.optionDisabled : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <li
            key={option.value}
            id={`${reactId}-opt-${index}`}
            role="option"
            data-index={index}
            className={optionClass}
            aria-selected={isSelected}
            aria-disabled={option.disabled || undefined}
            onMouseEnter={() => {
              if (!option.disabled) setHighlight(index)
            }}
            onPointerDown={(event) => {
              // Keep focus on the trigger; also stop document-level dismiss races.
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              event.stopPropagation()
              if (!option.disabled) commit(index)
            }}
          >
            <span className={styles.optionLabel}>{option.label}</span>
            {isSelected ? (
              <span className={styles.check} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7.2L5.4 10.1L11.5 3.8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className={rootClass} ref={rootRef}>
      {label ? (
        <span className={styles.label} id={labelId}>
          {label}
        </span>
      ) : null}
      <div className={styles.control}>
        <button
          ref={triggerRef}
          type="button"
          id={triggerId}
          className={triggerClass}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={labelId}
          aria-label={label ? undefined : ariaLabel}
          onClick={toggle}
          onKeyDown={onTriggerKeyDown}
        >
          <span className={styles.value}>{selected?.label ?? value}</span>
          <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 4.25L6 7.75L9.5 4.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
      {/*
        Portal the listbox to document.body so ancestor overflow:hidden
        (GlassPanel, AppShell, etc.) cannot clip the menu. Fixed coords
        track the trigger and float above every surface in the app.
      */}
      {typeof document !== 'undefined' && open && coords
        ? createPortal(menu, document.body)
        : null}
    </div>
  )
}
