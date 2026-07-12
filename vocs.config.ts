import {defineConfig} from "vocs/config";

export default defineConfig({
  // Keep Vite's root at the repo root (default) but move Vocs' sources under
  // `docs/` so they don't collide with the library's own `src/` and `dist/`.
  srcDir: "docs",
  // Keep the docs site output separate from the library build (dist/).
  outDir: "site",
  // GitHub Pages is static hosting — emit fully pre-rendered HTML for every route.
  renderStrategy: "full-static",
  // Project Pages are served from https://react-dropzone.github.io/file-selector/,
  // so every asset/route must be prefixed. Drop this if a custom domain is used.
  basePath: "/file-selector",
  title: "file-selector",
  titleTemplate: "%s · file-selector",
  description: "Convert a DragEvent or file input into a flat list of File objects.",
  // The copy button is absolutely positioned inside the horizontally-scrolling <pre>,
  // so it rides the scroll. Anchor it to the non-scrolling code-block wrapper instead.
  head: {
    style: [
      {
        innerHTML: "[data-v-code-container]{position:relative}[data-v-code-container]>pre.shiki{position:static}"
      }
    ]
  },
  editLink: {
    link: "https://github.com/react-dropzone/file-selector/edit/main/docs/pages/:path",
    text: "Suggest changes to this page"
  },
  socials: [{icon: "github", link: "https://github.com/react-dropzone/file-selector"}],
  topNav: [
    {text: "Guide", link: "/getting-started"},
    {text: "Playground", link: "/playground"}
  ],
  sidebar: [
    {
      text: "Guide",
      collapsed: false,
      items: [
        {text: "Getting Started", link: "/getting-started"},
        {text: "API Reference", link: "/api"},
        {text: "Browser Support", link: "/browser-support"}
      ]
    },
    {text: "Playground", link: "/playground"}
  ]
});
