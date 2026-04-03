/**
 * Barrel re-export of the full lucide icons map.
 *
 * This file exists so Vite can code-split it into its own chunk.
 * Importing it statically would pull all ~1 800 icons into the main
 * bundle; instead we dynamic-import this module only when a project
 * logo references a lucide icon name, keeping the initial load small
 * while still supporting any icon for future projects.
 */
export { icons } from "lucide-react";
