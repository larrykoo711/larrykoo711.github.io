import { hopeTheme } from "vuepress-theme-hope";
import { zhNavbar } from "./navbar/index.js";
import { zhSidebar } from "./sidebar/index.js";

export default hopeTheme({
  hostname: "https://larrykoo711.github.io",

  author: {
    name: "古老师 (LarryKoo)",
    url: "https://larrykoo711.github.io",
    email: "larry.koo711@gmail.com",
  },
  logo: "/logo.png",
  repo: "larrykoo711",
  docsDir: "src",
  // navbar
  navbar: zhNavbar,
  // sidebar  
  sidebar: zhSidebar,
  footer: "© 2025 古老师 (LarryKoo) | AI 降临派",
  displayFooter: true,
  blog: {
    description: "专注云原生 |  🤖 AI 降临派 | 🧑‍💻 投身人工智能/ LLM / Agent | ✨ AIGC 创作",
    intro: "/intro.html",
    timeline: "时光轴",
    medias: {
      GitHub: "https://github.com/larrykoo711",
      Twitter: "https://x.com/larrykooisai"
    }
  },
  metaLocales: {
    // editLink: "在 GitHub 上编辑此页",
  },
  encrypt: {
    config: {
      // 需要加密的页面配置
      // "/demo/encrypt.html": ["1234"],
    },
  },
  plugins: {
    blog: true,
    feed: {
      atom: true,
      json: true,
      rss: true,
    },
    // 评论功能配置 - 需要时取消注释并配置你的实际参数
    // comment: {
    //   provider: "Giscus",
    //   repo: "your-username/your-repo",
    //   repoId: "your-repo-id",
    //   category: "General",
    //   categoryId: "your-category-id",
    // },
    icon: {
      assets: "fontawesome",
    },
    // uncomment these if you want a PWA
    // pwa: {
    //   favicon: "/favicon.ico",
    //   cacheHTML: true,
    //   cachePic: true,
    //   appendBase: true,
    //   apple: {
    //     icon: "/assets/icon/apple-icon-152.png",
    //     statusBarColor: "black",
    //   },
    //   msTile: {
    //     image: "/assets/icon/ms-icon-144.png",
    //     color: "#ffffff",
    //   },
    //   manifest: {
    //     icons: [
    //       {
    //         src: "/assets/icon/chrome-mask-512.png",
    //         sizes: "512x512",
    //         purpose: "maskable",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-mask-192.png",
    //         sizes: "192x192",
    //         purpose: "maskable",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //     ],
    //     shortcuts: [
    //       {
    //         name: "Demo",
    //         short_name: "Demo",
    //         url: "/demo/",
    //         icons: [
    //           {
    //             src: "/assets/icon/guide-maskable.png",
    //             sizes: "192x192",
    //             purpose: "maskable",
    //             type: "image/png",
    //           },
    //         ],
    //       },
    //     ],
    //   },
    // },
  },
});
