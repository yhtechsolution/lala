/**
 * Shared Tailwind class helper. clsx joins conditional class inputs; tailwind-merge
 * resolves conflicting utility classes so caller overrides can take effect.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combines conditional classes with clsx, then resolves Tailwind conflicts with twMerge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
