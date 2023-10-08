<script setup>
import {onMounted, ref, onBeforeUnmount} from "vue";
import "cesium/Build/CesiumUnminified/Widgets/widgets.css";
import {
  Cesium3DTileset,
  Cartographic,
  Color,
  Cartesian3,
  MapboxStyleImageryProvider
} from "cesium";
import {useCesiumStore} from "@/store/cesium";
import {GroundSkyBox} from "@/utils/cesiumUtils/GroundSkyBox";
import LineFlowMaterialProperty from "@/libs/cesium/lineFlowMaterialProperty";

const viewerDivRef = ref();

window.CESIUM_BASE_URL = "libs/cesium/";
const cesiumStore = useCesiumStore();

onMounted(() => {
  cesiumStore.initViewer(viewerDivRef.value);
  initBasicMap();
  initSkyBox();
  loadBuilding();
  // 随机竖直飞线
  lineFlowInit(cesiumStore.viewer, [113.5117, 22.2509], 420);
});

onBeforeUnmount(() => {
  if (cesiumStore.viewer) {
    cesiumStore.viewer.destroy();
    cesiumStore.viewer = null;
  }
});

const initBasicMap = () => {
  // 移除默认的Bing Maps图层
  cesiumStore.viewer.imageryLayers.remove(
    cesiumStore.viewer.imageryLayers.get(0)
  );
  const mapboxLayer = new MapboxStyleImageryProvider({
    url: "https://api.mapbox.com/styles/v1",
    username: "2427324653",
    styleId: "clmgif2dc01bj01rf4a5398m7",
    accessToken:
      "pk.eyJ1IjoiMjQyNzMyNDY1MyIsImEiOiJja3VqbzZ1YWIyenQ0MnFtYTZidmVtcGZxIn0.ac02aZcfccK4nm0_cfEyDg",
    scaleFactor: true
  });
  cesiumStore.viewer.imageryLayers.addImageryProvider(mapboxLayer);
};
const initSkyBox = () => {
  let customSkybox;
  let defaultSkybox = cesiumStore.viewer.scene.skyBox;

  //设定为只在高缩放层级下才使用自定义天空盒
  cesiumStore.viewer.scene.preUpdate.addEventListener(() => {
    let position = cesiumStore.viewer.scene.camera.position;
    let cameraHeight = Cartographic.fromCartesian(position).height;

    if (cameraHeight < 240000) {
      if (!customSkybox) {
        customSkybox = new GroundSkyBox({
          viewer: cesiumStore.viewer,
          sources: {
            positiveX: new URL("/cesiumNightSkybox/px.png", import.meta.url)
              .href,
            negativeX: new URL("/cesiumNightSkybox/nx.png", import.meta.url)
              .href,
            positiveY: new URL("/cesiumNightSkybox/pz.png", import.meta.url)
              .href,
            negativeY: new URL("/cesiumNightSkybox/nz.png", import.meta.url)
              .href,
            positiveZ: new URL("/cesiumNightSkybox/py.png", import.meta.url)
              .href,
            negativeZ: new URL("/cesiumNightSkybox/ny.png", import.meta.url)
              .href
          }
        });
      }
    } else {
      if (customSkybox) {
        customSkybox.destroy();
        customSkybox = null;
        cesiumStore.viewer.scene.skyBox = defaultSkybox;
        cesiumStore.viewer.scene.skyAtmosphere.show = true;
      }
    }
  });
};

const loadBuilding = async () => {
  try {
    const tileset = await Cesium3DTileset.fromUrl(
      "/3dtiles/zhuai2/tileset.json"
    );
    cesiumStore.viewer.scene.primitives.add(tileset);

    cesiumStore.viewer.camera.setView({
      // 设置相机位置
      destination: {
        x: -2355679.849298287,
        y: 5415167.475987935,
        z: 2402040.516739451
      },
      orientation: {
        // 初始视角
        heading: 1.631577368410273,
        pitch: 0.01516822478588975,
        roll: 0.000011494109185328227
      }
    });
  } catch (error) {
    console.error(`Error creating tileset: ${error}`);
  }
};

/**
 * @description: 竖直随机飞线初始化
 * @param {*} _viewer
 * @param {*} _center ：中心点
 * @param {*} _num ：数量
 * @return {*}
 */
const lineFlowInit = (_viewer, _center, _num) => {
  let _positions = generateRandomPosition(_center, _num);
  _positions.forEach(item => {
    // 经纬度
    let start_lon = item[0];
    let start_lat = item[1];

    let startPoint = new Cartesian3.fromDegrees(start_lon, start_lat, 0);

    // 随机高度
    let height = 5000 * Math.random();
    let endPoint = new Cartesian3.fromDegrees(start_lon, start_lat, height);
    let linePositions = [];
    linePositions.push(startPoint);
    linePositions.push(endPoint);
    _viewer.entities.add({
      polyline: {
        positions: linePositions,
        material: new LineFlowMaterialProperty({
          color: new Color(0.8, 0.8, 0.1, 0.2),
          speed: 6 * Math.random(),
          percent: 0.1,
          gradient: 0.01
        })
      }
    });
  });
};

/**
 * @description: 产生随机点
 * @param {*} position：中心点坐标
 * @param {*} num：随机点数量
 * @return {*}
 */
const generateRandomPosition = (position, num) => {
  let list = [];
  for (let i = 0; i < num; i++) {
    // random产生的随机数范围是0-1，需要加上正负模拟
    let lon = position[0] + Math.random() * 0.04 * (i % 2 == 0 ? 1 : -1);
    let lat = position[1] + Math.random() * 0.04 * (i % 2 == 0 ? 1 : -1);
    list.push([lon, lat]);
  }
  return list;
};
</script>

<template>
  <div id="cesium-viewer" ref="viewerDivRef"></div>
</template>

<style lang="scss" scoped>
#cesium-viewer {
  width: 100%;
  height: 100vh;
}
</style>
