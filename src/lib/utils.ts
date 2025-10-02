import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatResult(result: number | null | undefined): string {
  if (result === null || result === undefined) {
    return "--";
  }
  return result.toString().padStart(2, '0');
}
