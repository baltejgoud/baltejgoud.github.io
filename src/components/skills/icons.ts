import {
  siC,
  siDocker,
  siElectron,
  siExpress,
  siFastapi,
  siFigma,
  siFirebase,
  siGit,
  siGooglecloud,
  siJavascript,
  siKubernetes,
  siModelcontextprotocol,
  siMongodb,
  siNestjs,
  siNextdotjs,
  siNodedotjs,
  siOpenapiinitiative,
  siPostgresql,
  siPython,
  siPytorch,
  siReact,
  siSqlite,
  siSupabase,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
} from "simple-icons";

export interface BrandIcon {
  title: string;
  hex: string;
  path: string;
}

/** Logos by simple-icons slug. Only the icons imported here end up in the bundle. */
export const skillIcons: Record<string, BrandIcon> = {
  python: siPython,
  typescript: siTypescript,
  javascript: siJavascript,
  c: siC,
  react: siReact,
  nextdotjs: siNextdotjs,
  threedotjs: siThreedotjs,
  electron: siElectron,
  tailwindcss: siTailwindcss,
  nodedotjs: siNodedotjs,
  fastapi: siFastapi,
  express: siExpress,
  nestjs: siNestjs,
  openapiinitiative: siOpenapiinitiative,
  postgresql: siPostgresql,
  sqlite: siSqlite,
  mongodb: siMongodb,
  supabase: siSupabase,
  firebase: siFirebase,
  git: siGit,
  docker: siDocker,
  kubernetes: siKubernetes,
  figma: siFigma,
  googlecloud: siGooglecloud,
  pytorch: siPytorch,
  modelcontextprotocol: siModelcontextprotocol,
};
