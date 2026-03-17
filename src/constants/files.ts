// Single source of truth for file filtering across the entire app

export const SUPPORTED_TEXT_EXTENSIONS = new Set([
  // Web Development
  "js", "jsx", "ts", "tsx", "html", "htm", "css", "scss", "sass", "less",
  "vue", "svelte", "astro", "json", "xml", "yaml", "yml", "toml",
  // Programming Languages
  "py", "pyx", "pyi", "pyw", "java", "kt", "kts", "scala", "groovy",
  "c", "cpp", "cc", "cxx", "h", "hpp", "hxx", "cs", "vb", "fs", "fsx",
  "go", "rs", "swift", "rb", "php", "pl", "pm", "r", "jl",
  "dart", "elm", "hs", "lhs", "ml", "mli", "f", "f90", "f95",
  // Shell & Config
  "sh", "bash", "zsh", "fish", "bat", "cmd", "ps1", "psm1",
  "mk", "cmake", "gradle", "build",
  "env", "ini", "conf", "config", "properties", "cfg",
  // Documentation & Markup
  "md", "markdown", "mdx", "rst", "adoc", "asciidoc", "tex", "txt",
  // Database & Query
  "sql", "nosql", "cypher", "sparql", "graphql", "gql",
  // Other
  "schema", "prisma", "lock",
]);

export const SPECIAL_TEXT_FILENAMES = [
  /^dockerfile$/i,
  /^makefile$/i,
  /^readme(\..+)?$/i,
  /^\.gitignore$/i,
  /^\.gitattributes$/i,
  /^\.editorconfig$/i,
  /^\.eslintrc(\..+)?$/i,
  /^\.prettierrc(\..+)?$/i,
  /^tsconfig(\..+)?$/i,
  /^jsconfig(\..+)?$/i,
  /^webpack(\..+)?$/i,
  /^schema\.prisma$/i,
  /^prisma\.schema$/i,
];

export const IGNORED_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "out",
  ".cache", "coverage", ".nyc_output", "tmp", "temp",
]);

export const IGNORED_FILES = new Set([
  "package-lock.json",
  ".ds_store",
]);

export function isSupportedTextFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  if (IGNORED_FILES.has(lower)) return false;

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (SUPPORTED_TEXT_EXTENSIONS.has(ext)) return true;

  return SPECIAL_TEXT_FILENAMES.some((pattern) => pattern.test(fileName));
}

// File extension list for Electron's file dialog filter
export const DIALOG_FILE_EXTENSIONS = Array.from(SUPPORTED_TEXT_EXTENSIONS);
