import * as React from "react";

import { cn } from "../../utils/cn"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base placeholder:text-neutral-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-action focus:border-brand-action transition-all disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
