// shadcn's classname helper. `npx shadcn@latest add button` will drop components
// here that import this. Kept dependency-free so the project runs without extra installs.
export function cn(...inputs) {
  return inputs.flat().filter(Boolean).join(" ");
}
