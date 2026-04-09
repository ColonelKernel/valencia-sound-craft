import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, min = 0, max = 100, step = 1, value, defaultValue, onValueChange, disabled, ...props }, ref) => {
    const currentValue = value?.[0] ?? defaultValue?.[0] ?? min;
    const percent = ((currentValue - min) / (max - min)) * 100;

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={(e) => onValueChange?.([Number(e.target.value)])}
          className="slider-input h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary disabled:pointer-events-none disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percent}%, hsl(var(--secondary)) ${percent}%, hsl(var(--secondary)) 100%)`,
          }}
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
