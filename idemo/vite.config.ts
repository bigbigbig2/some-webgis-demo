import {defineConfig} from "vite";
import {fileURLToPath, URL} from "url";
import vue from "@vitejs/plugin-vue";
import eslint from "vite-plugin-eslint";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import {viteExternalsPlugin} from "vite-plugin-externals";
import {insertHtml, h} from "vite-plugin-insert-html";
import {viteStaticCopy} from "vite-plugin-static-copy";
import compress from "vite-plugin-compression";


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    eslint({lintOnStart: true, cache: false}),
    viteExternalsPlugin({
      cesium: "Cesium"
    }),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/cesium/Build/CesiumUnminified/Cesium.js",
          dest: "libs/cesium/"
        },
        {
          src: "node_modules/cesium/Build/CesiumUnminified/Assets/*",
          dest: "libs/cesium/Assets/"
        },
        {
          src: "node_modules/cesium/Build/CesiumUnminified/ThirdParty/*",
          dest: "libs/cesium/ThirdParty/"
        },
        {
          src: "node_modules/cesium/Build/CesiumUnminified/Workers/*",
          dest: "libs/cesium/Workers/"
        },
        {
          src: "node_modules/cesium/Build/CesiumUnminified/Widgets/*",
          dest: "libs/cesium/Widgets/"
        }
      ]
    }),
    insertHtml({
      head: [
        h("script", {
          // src: "libs/cesium/Cesium.js"
          //还是这种方式好些（才1.4m）
          src: "https://cdn.jsdelivr.net/npm/cesium@1.110.0/Build/Cesium/Cesium.min.js"
        })
      ]
    }),
    compress({
      threshold: 10 * 1024 // 10KB 以下不压缩
    }),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    //配置公共API的代理
    host: "0.0.0.0",
    cors: true,
    proxy: {
      "/Api": {
        target: "http://typhoon.zjwater.gov.cn",
        changeOrigin: true
      },
      // "/api/auth": {
      //   target: "http://175.178.49.159:8080",
      //   changeOrigin: true
      // },
      // "/api/hexagons": {
      //   target: "http://175.178.49.159:8080",
      //   changeOrigin: true
      // }
    }
  }
});
