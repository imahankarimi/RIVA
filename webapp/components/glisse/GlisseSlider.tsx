"use client";

import { forwardRef } from "react";
import { Slider as GlisseSlider, type SliderProps as GlisseSliderProps } from "glisse";

/**
 * RIVA wrapper for Glisse Slider
 * Preserves continuous/stepped behavior, drag interaction, and lens behavior
 */
export const Slider = forwardRef<HTMLInputElement, GlisseSliderProps>(
  (props, ref) => {
    return <GlisseSlider ref={ref} {...props} />;
  }
);
Slider.displayName = "GlisseSlider";
