import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isGithubPagesBuild = Boolean(process.env.GITHUB_ACTIONS && repositoryName);

export default defineConfig({
  plugins: [react()],
  base: isGithubPagesBuild ? `/${repositoryName}/` : "/",
});
