/**
 * RIVA × Glisse Integration Layer
 *
 * This module re-exports the official Glisse components and provides
 * RIVA-specific wrappers where needed for i18n, RTL, and theme integration.
 *
 * Components from glisse@0.5.0:
 * - Button (glass, filled, tinted, destructive variants)
 * - Glass (refraction, bend, dispersion, frost, rim shine)
 * - Input (with icons, disabled states)
 * - SearchField (magnifier, clear button)
 * - Menu (items, separators, icons, destructive, disabled)
 * - SegmentedControl (selection animation, dragging, lens)
 * - Slider (continuous, stepped, disabled, drag interaction)
 * - Switch (checked/unchecked, disabled, animation)
 * - TabBar (spring transitions, drag, lift, lens expansion, link navigation)
 *
 * Official reference: https://glisse.kelvinzhang.com/
 * Repository: https://github.com/0kzh/glisse
 */

// Direct re-exports from the official package
export {
  Button,
  Glass,
  Input,
  SearchField,
  Menu,
  SegmentedControl,
  Slider,
  Switch,
  TabBar,
} from "glisse";

export type {
  ButtonProps,
  GlassProps,
  InputProps,
  SearchFieldProps,
  MenuProps,
  MenuItem,
  MenuEntry,
  SegmentedControlProps,
  SegmentedControlItem,
  SliderProps,
  SwitchProps,
  TabBarProps,
  TabBarItem,
} from "glisse";
