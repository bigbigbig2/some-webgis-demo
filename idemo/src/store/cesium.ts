import {defineStore} from "pinia";
import {Viewer, Camera, Rectangle} from "cesium";
import * as Cesium from "cesium";

export const useCesiumStore = defineStore("cesium", {
  state: () => ({
    viewer: null as Viewer | null,
    openComponent: ""
  }),
  actions: {
    async initViewer(domId: HTMLElement, options?) {
      Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMWMxMTQzYi1hNjk0LTRmYjctOGRhNC04YmNjMTc4MWNkMDEiLCJpZCI6ODM0OTksImlhdCI6MTY0NTYxNjAxNH0.VU2CN0rffcVQiA9RcbQgrFa31ZwgUa7_Y3GDB6c2luI";
      try {
        if (this.viewer) {
          this.viewer.destroy();
          this.viewer = null;
        }
        //相机默认位于中国上方
        Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(
          75.0, // 西经
          0.0, // 南纬
          140.0, // 东经
          60.0 // 北纬
        );
        const viewer = new Viewer(domId, {
          ...options,
          animation: false, // 动画小组件
          baseLayerPicker: false, // 底图组件，选择三维数字地球的底图（imagery and terrain）。
          fullscreenButton: false, // 全屏组件
          vrButton: false, // VR模式
          geocoder: false, // 地理编码（搜索）组件
          homeButton: false, // 首页，点击之后将视图跳转到默认视角
          infoBox: false, // 信息框
          sceneModePicker: false, // 场景模式，切换2D、3D 和 Columbus View (CV) 模式。
          selectionIndicator: false, //是否显示选取指示器组件
          timeline: false, // 时间轴
          navigationHelpButton: false, // 帮助提示，如何操作数字地球。
          // 如果最初应该看到导航说明，则为true；如果直到用户明确单击该按钮，则该提示不显示，否则为false。
          navigationInstructionsInitiallyVisible: false,
          requestRenderMode: false,
          scene3DOnly: false,
          shouldAnimate: true
          // terrainProvider: await createWorldTerrainAsync({
          // 光照阴影
          // requestVertexNormals: true,
          // 水流效果
          // requestWaterMask: true,
          // }), // 显示地形
        });
        // 用 Object.freeze 阻止 Vue 的响应式系统访问 viewer 对象的子属性
        this.viewer = Object.freeze(viewer);
        this.viewer._cesiumWidget._creditContainer.style.display = "none";
      } catch (error) {
        console.log(error);
      }
    }
  }
});
