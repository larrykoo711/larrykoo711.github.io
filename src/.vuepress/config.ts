import { defineUserConfig } from "vuepress";
import { viteBundler } from '@vuepress/bundler-vite';
import { llmsPlugin } from "@vuepress/plugin-llms";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",
  bundler: viteBundler(),
  plugins: [
    llmsPlugin({
      // 配置 AI LLMs 插件选项
    }),
  ],
  lang: "zh-CN",
  title: "古老师的博客",
  description: "古老师的博客 - 专注云原生 |  🤖 AI 降临派 | 🧑‍💻 投身人工智能/ LLM / Agent | ✨ AIGC 创作",
  theme,
  shouldPrefetch: false,
});
