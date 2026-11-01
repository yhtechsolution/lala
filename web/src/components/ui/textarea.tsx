/**
 * Reusable UI module: Styled native multiline input that forwards the ref and remaining textarea attributes.
 * forwardRef passes a caller ref to the underlying element; ...props forwards
 * remaining attributes/events. cn merges base styles with caller classes.
 * Primitive state is styled through data/aria attributes; exported pieces are
 * composed by callers. Presence in this folder does not mean the app uses it.
 */
import * as React from "react";

import { cn } from "@/lib/utils";

/** Styled native multiline input that forwards the ref and remaining textarea attributes. */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
