import {
  IconFileCode,
  IconFileTypeTsx,
  IconFileTypeTs,
  IconFileTypeCss,
  IconFileTypeHtml,
  IconFileTypePhp,
  IconBrandPython,
  IconFileTypeJsx,
  IconDatabase,
  IconBrandReact,
  IconCode,
  IconMarkdown,
  IconSettings,
  IconJson,
  IconToml,
  IconSql,
  IconBrandDocker,
  IconBrandJavascript,
  IconBrandCSharp,
  IconFileTypeXml,
  IconCoffee,
} from "@tabler/icons-react";

const getFileIcon = (filePath: string) => {
  const extension = filePath.split(".").pop()?.toLowerCase() || "";
  const fileName = filePath.split("/").pop()?.toLowerCase() || "";

  // Check specific file names first
  if (fileName.includes("dockerfile"))
    return <IconFileCode size={20} className="text-blue-600" />;
  if (fileName.includes("makefile"))
    return <IconSettings size={20} className="text-gray-600" />;
  if (fileName.includes("readme"))
    return <IconMarkdown size={20} className="text-green-600" />;

  // Check extensions
  switch (extension) {
    case "js":
      return <IconBrandJavascript size={20} className="text-yellow-500" />;
    case "jsx":
      return <IconFileTypeJsx size={20} className="text-blue-500" />;
    case "ts":
      return <IconFileTypeTs size={20} className="text-blue-600" />;
    case "tsx":
      return <IconFileTypeTsx size={20} className="text-blue-600" />;
    case "html":
    case "htm":
      return <IconFileTypeHtml size={20} className="text-orange-600" />;
    case "css":
    case "scss":
    case "sass":
    case "less":
      return <IconFileTypeCss size={20} className="text-blue-500" />;
    case "py":
    case "pyx":
    case "pyi":
    case "pyw":
      return <IconBrandPython size={20} className="text-green-600" />;
    case "php":
      return <IconFileTypePhp size={20} className="text-purple-600" />;
    case "java":
    case "jar":
    case "class":
    case "kotlin":
    case "kt":
    case "scala":
      return <IconCoffee size={20} className="text-orange-700" />;
    case "cs":
    case "csx":
      return <IconBrandCSharp size={20} className="text-purple-700" />;
    case "vb":
    case "vbnet":
    case "fs":
    case "fsx":
    case "fsi":
    case "csproj":
    case "vbproj":
    case "fsproj":
    case "sln":
    case "props":
    case "targets":
      return <IconBrandCSharp size={20} className="text-purple-600" />;
    case "json":
      return <IconJson size={20} className="text-gray-600" />;
    case "yaml":
    case "yml":
      return <IconCode size={20} className="text-gray-600" />;
    case "toml":
      return <IconToml size={20} className="text-gray-600" />;
    case "sql":
      return <IconSql size={20} className="text-gray-600" />;
    case "nosql":
    case "cypher":
    case "sparql":
    case "graphql":
    case "gql":
      return <IconDatabase size={20} className="text-blue-700" />;
    case "md":
    case "markdown":
    case "mdx":
    case "rst":
    case "adoc":
    case "asciidoc":
      return <IconMarkdown size={20} className="text-green-600" />;
    case "vue":
      return <IconBrandReact size={20} className="text-green-500" />;
    case "svelte":
      return <IconBrandReact size={20} className="text-orange-500" />;
    case "astro":
      return <IconBrandReact size={20} className="text-purple-500" />;
    case "xml":
    case "xaml":
    case "resx":
    case "config":
      return <IconFileTypeXml size={20} className="text-orange-600" />;
    case "dockerfile":
      return <IconBrandDocker size={20} className="text-gray-600" />;
    case "gitignore":
    case "gitattributes":
    case "editorconfig":
    case "eslintrc":
    case "prettierrc":
    case "babelrc":
    case "tsconfig":
    case "jsconfig":
    case "webpack":
      return <IconSettings size={20} className="text-gray-600" />;
    default:
      return <IconFileCode size={20} className="text-gray-500" />;
  }
};

export default getFileIcon;
