/**
 * Reusable UI module: Styled native input that forwards DOM refs and all remaining input attributes.
 * forwardRef passes a caller ref to the underlying element; ...props forwards
 * remaining attributes/events. cn merges base styles with caller classes.
 * Primitive state is styled through data/aria attributes; exported pieces are
 * composed by callers. Presence in this folder does not mean the app uses it.
 */
import * as React from "react";

import { cn } from "@/lib/utils";

/** Styled native input that forwards DOM refs and all remaining input attributes. */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
