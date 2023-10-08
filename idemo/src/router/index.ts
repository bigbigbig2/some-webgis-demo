import {createRouter, createWebHashHistory, RouteRecordRaw} from "vue-router";

import home from "@/components/home.vue";
import startPage from "@/views/startPage.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "login",
    component: () => import("@/views/login/index.vue"),
    // redirect: "/startPage", // 重定向到某个子路由
    meta: {
      title: "登录页"
    },
    children: [
      {
        path: "",
        name: "welcome-login",
        component: () => import("@/views/login/LoginPage.vue")
      },
      {
        path: "register",
        name: "welcome-register",
        component: () => import("@/views/login/RegisterPage.vue")
      },
      {
        path: "forget",
        name: "welcome-forget",
        component: () => import("@/views/login/ForgetPage.vue")
      }
    ]
  },
  {
    path: "/startPage",
    name: "home",
    component: home,
    // redirect: "/startPage", // 重定向到某个子路由
    meta: {
      title: "首页"
    },
    children: [
      {
        name: "startPage",
        path: "/startPage",
        meta: {
          title: "开始页"
        },
        component: startPage
      },
      {
        name: "night",
        path: "/night",
        meta: {
          title: "Earth at Night"
        },
        component: () => import("@/views/night.vue")
      },
      {
        name: "buildings",
        path: "/buildings",
        meta: {
          title: "China Buildings"
        },
        component: () => import("@/views/buildings.vue")
      },
      {
        name: "queryWFS",
        path: "/queryWFS",
        meta: {
          title: "通过WFS查询要素"
        },
        component: () => import("@/views/queryWFS.vue")
      },
      // {
      //   name: "addWFS",
      //   path: "/addWFS",
      //   meta: {
      //     title: "通过WFS添加要素",
      //   },
      //   component: () => import("@/views/addWFS.vue"),
      // },
      {
        name: "deleteWFS",
        path: "/deleteWFS",
        meta: {
          title: "通过WFS删除要素"
        },
        component: () => import("@/views/deleteWFS.vue")
      },
      {
        name: "operateWFS",
        path: "/operateWFS",
        meta: {
          title: "通过WFS修改要素"
        },
        component: () => import("@/views/operateWFS.vue")
      },
      {
        name: "rain",
        path: "/rain",
        meta: {
          title: "雨水分布图"
        },
        component: () => import("@/views/rain.vue")
      },
      {
        name: "grid",
        path: "/grid",
        meta: {
          title: "动态格网统计分析"
        },
        component: () => import("@/views/grid.vue")
      },
      {
        name: "phong",
        path: "/phong",
        meta: {
          title: "phong着色模型"
        },
        component: () => import("@/views/phong.vue")
      },
      {
        name: "log",
        path: "/log",
        meta: {
          title: "更新日志"
        },
        component: () => import("@/views/log.vue")
      },
      {
        name: "arc",
        path: "/arc",
        meta: {
          title: "网站架构"
        },
        component: () => import("@/views/arc.vue")
      },

      {
        name: "cesiumNumCity",
        path: "/cesiumNumCity",
        meta: {
          title: "数字城市场景"
        },
        component: () => import("@/views/cesium/cesiumNumCity.vue")
      },
      {
        name: "cesiumRealScene",
        path: "/cesiumRealScene",
        meta: {
          title: "实景三维场景"
        },
        component: () => import("@/views/cesium/cesiumRealScene.vue")
      },
      {
        name: "lightShadow",
        path: "/lightShadow",
        meta: {
          title: "光照与阴影"
        },
        component: () => import("@/views/three/lightShadow.vue")
      },
      {
        name: "particlesMap",
        path: "/particlesMap",
        meta: {
          title: "粒子系统-星空"
        },
        component: () => import("@/views/three/particlesMap.vue")
      },
      {
        name: "particlesAnimate",
        path: "/particlesAnimate",
        meta: {
          title: "粒子系统-动画"
        },
        component: () => import("@/views/three/particlesAnimate.vue")
      },
      {
        name: "particlesGalaxy",
        path: "/particlesGalaxy",
        meta: {
          title: "银河动画"
        },
        component: () => import("@/views/three/particlesGalaxy.vue")
      },
      {
        name: "physicsEngine",
        path: "/physicsEngine",
        meta: {
          title: "物理模拟"
        },
        component: () => import("@/views/three/physicsEngine.vue")
      },
      {
        name: "realisticRender",
        path: "/realisticRender",
        meta: {
          title: "环境映射与色调"
        },
        component: () => import("@/views/three/realisticRender.vue")
      },
      {
        name: "rawShaderMaterial",
        path: "/rawShaderMaterial",
        meta: {
          title: "原始着色器材质"
        },
        component: () => import("@/views/three/rawShaderMaterial.vue")
      },
      {
        name: "modifiedMaterials",
        path: "/modifiedMaterials",
        meta: {
          title: "修改内置着色器材质"
        },
        component: () => import("@/views/three/modifiedMaterials.vue")
      },
      {
        name: "cesiumdeck",
        path: "/cesiumdeck",
        meta: {
          title: "cesium与deck整合"
        },
        component: () => import("@/views/Integrate/cesiumdeck.vue")
      },
      {
        name: "cesiumthree",
        path: "/cesiumthree",
        meta: {
          title: "cesium与three整合"
        },
        component: () => import("@/views/Integrate/cesiumthree.vue")
      },
      {
        name: "mapboxwebgl2",
        path: "/mapboxwebgl2",
        meta: {
          title: "mapbox使用webgl2自定义图层"
        },
        component: () => import("@/views/Integrate/mapboxwebgl2.vue")
      },
      {
        name: "mapboxregl",
        path: "/mapboxregl",
        meta: {
          title: "mapbox使用regl自定义图层"
        },
        component: () => import("@/views/Integrate/mapboxregl.vue")
      },
      {
        name: "mapboxtwgl",
        path: "/mapboxtwgl",
        meta: {
          title: "mapbox使用twgl定义图层"
        },
        component: () => import("@/views/Integrate/mapboxtwgl.vue")
      },
      {
        name: "triangulation",
        path: "/triangulation",
        meta: {
          title: "webgl使用三角剖分绘制多边形"
        },
        component: () => import("@/views/webgl/triangulation.vue")
      },
      {
        name: "InTriangle",
        path: "/InTriangle",
        meta: {
          title: "判断点是否在多边形内"
        },
        component: () => import("@/views/webgl/InTriangle.vue")
      },
      {
        name: "cubeTexture",
        path: "/cubeTexture",
        meta: {
          title: "拖动旋转与简单贴图"
        },
        component: () => import("@/views/webgl/cubeTexture.vue")
      },
      {
        name: "wind",
        path: "/wind",
        meta: {
          title: "全球风场"
        },
        component: () => import("@/views/webgl/wind.vue")
      }
    ]
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
