<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="containerD">
    <div ref="cesiumContainer" class="cesium-container"></div>
  </div>
</template>

<script setup>
import {onMounted, ref} from "vue";
import {ShadowMode} from "cesium";
import {Deck, _GlobeView} from "@deck.gl/core";
import {GeoJsonLayer, ArcLayer} from "@deck.gl/layers";
import "cesium/Build/CesiumUnminified/Widgets/widgets.css";
import {useCesiumStore} from "@/store/cesium";

const cesiumContainer = ref(null);
window.CESIUM_BASE_URL = "libs/cesium/";
const cesiumStore = useCesiumStore();
//deck对象
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let deck;

const AIR_PORTS =
  "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson";

onMounted(() => {
  initCesium();
  initDeck();
  startRenderLoop();
});
const initCesium = () => {
  cesiumStore.initViewer(cesiumContainer.value, {
    useDefaultRenderLoop: false, //关闭默认渲染循环
    allowTextureFilterAnisotropic: false,
    targetFrameRate: 60,
    orderIndependentTranslucency: true,
    automaticallyTrackDataSourceClocks: false,
    dataSources: null,
    clock: null,
    terrainShadows: ShadowMode.DISABLED
  });

  cesiumStore.viewer.scene.debugShowFramesPerSecond = true;

  // cesiumStore.viewer.camera.setView({
  //   // 设置相机位置
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   //@ts-ignore
  //   destination: {
  //     x: -1621088.1223693471,
  //     y: 5549956.304614017,
  //     z: 2688154.0360511034
  //   },
  //   orientation: {
  //     // 初始视角
  //     heading: 4.060505987926523,
  //     pitch: -0.25042708182866047,
  //     roll: 0.000015209352906886409
  //   }
  // });
};

const initDeck = () => {
  deck = new Deck({
    views: new _GlobeView({
      resolution: 10
    }),
    initialViewState: {longitude: 0, latitude: 0, zoom: 1},
    controller: false,

    parent: cesiumContainer.value,
    style: {pointerEvents: "none", position: "absolute", top: 0},
    layers: [
      new GeoJsonLayer({
        id: "airports",
        data: AIR_PORTS,
        // Styles
        filled: true,
        pointRadiusMinPixels: 2,
        pointRadiusScale: 2000,
        getPointRadius: f => 11 - f.properties.scalerank,
        getFillColor: [200, 0, 80, 180],
        // Interactive props
        pickable: true,
        autoHighlight: true,
        onClick: info =>
          info.object &&
          alert(
            `${info.object.properties.name} (${info.object.properties.abbrev})`
          )
      }),
      new ArcLayer({
        id: "arcs",
        data: AIR_PORTS,
        dataTransform: d => d.features.filter(f => f.properties.scalerank < 4),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getSourcePosition: f => [-0.4531566, 51.4709959], // London
        getTargetPosition: f => f.geometry.coordinates,
        getSourceColor: [0, 128, 200],
        getTargetColor: [200, 0, 80],
        getWidth: 1
      })
    ]
  });
};
const renderCesium = () => {
  cesiumStore.viewer.render();
};

const startRenderLoop = () => {
  requestAnimationFrame(startRenderLoop);
  renderCesium();
};
</script>

<style scoped>
.containerD {
  width: 92.23vw;
  height: 100vh;
}
.cesium-container {
  width: 100%;
  height: 100%;
}

/* .cesium-container canvas:nth-child(2) {
  position: absolute;
  top: 0;
  pointer-events: none;
}

canvas#deckgl-overlay {
  position: absolute;
  top: 0;
  pointer-events: none;
} */
</style>
