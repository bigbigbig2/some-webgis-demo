<template>
  <div class="container">
    <div id="cesiumContainer" :style="{height: this.height}"></div>
  </div>
</template>
<script>
import * as Cesium from "Cesium";
export default {
  name: "3D",
  data() {
    return {
      height: window.innerHeight + "px"
    };
  },
  mounted() {
    Cesium.Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMWMxMTQzYi1hNjk0LTRmYjctOGRhNC04YmNjMTc4MWNkMDEiLCJpZCI6ODM0OTksImlhdCI6MTY0NTYxNjAxNH0.VU2CN0rffcVQiA9RcbQgrFa31ZwgUa7_Y3GDB6c2luI";
    const viewer = new Cesium.Viewer("cesiumContainer", {
      animation: false, //动画小控件
      baseLayerPicker: false, //图层选择器
      fullscreenButton: false,
      geocoder: false, //查询按钮
      infoBox: false,
      sceneModePicker: false,
      timeline: false,
      selectionIndicator: false,
      navigationHelpButton: false
    });
    viewer._cesiumWidget._creditContainer.style.display = "none";
    // var wmsEarthNight = new Cesium.WebMapServiceImageryProvider({
    //     url:'http://124.221.72.79:8080/geoserver/webgis_demo/wms',
    //     layers:'webgis_demo:2016',
    //     parameters:{
    //         service: 'WMS',
    //         format:'image/png8',
    //         transparent:true,
    //     }

    // });
    var wmtsEarthNight = new Cesium.WebMapTileServiceImageryProvider({
      url: "http://124.221.72.79:8080/geoserver/gwc/service/wmts/rest/webgis_demo:2016/{style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}?format=image/png",
      style: "",
      format: "image/png",
      layer: "webgis_demo:2016",
      tileMatrixSetID: "EPSG:900913",
      tileMatrixLabels: [
        "EPSG:900913:0",
        "EPSG:900913:1",
        "EPSG:900913:2",
        "EPSG:900913:3",
        "EPSG:900913:4",
        "EPSG:900913:5",
        "EPSG:900913:6"
      ],
      minimumLevel: 0,
      maximumLevel: 6
    });
    viewer.imageryLayers.addImageryProvider(wmtsEarthNight);
    // viewer.imageryLayers.addImageryProvider(wmsEarthNight)
  }
};
</script>

<style>
html,
body,
#cesiumContainer {
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
