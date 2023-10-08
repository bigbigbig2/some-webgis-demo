<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import {onMounted, onBeforeUnmount} from "vue";
import {ElMessage} from "element-plus";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import "./../assets/style/mapbox-gl.css";

// let loading = ref(false);

let map;

onMounted(() => {
  map = initMap();
  map.addControl(language);
  map.on("load", () => {
    console.log("sdfad");
    map.addSource("grid_source", {
      type: "vector",
      scheme: "xyz",
      // tiles: ["http://175.178.49.159:3030/v1/hexagons/mvt/{z}/{x}/{y}"]
      tiles: ["http://175.178.49.159:8080/api/hexagons/{z}/{x}/{y}"]
      // tiles: ["http://localhost:8080/api/hexagons/{z}/{x}/{y}"]
    });
    map.addLayer({
      id: "test_polygon",
      type: "fill",
      source: "grid_source",
      "source-layer": "fixed_hexagons",
      paint: {
        "fill-color": [
          "case",
          ["<=", ["to-number", ["get", "avg_d_kbps"]], 1024],
          "rgba(254,0,0,)",
          ["<=", ["to-number", ["get", "avg_d_kbps"]], 3072],
          "rgba(237, 85, 14,1)",
          ["<=", ["to-number", ["get", "avg_d_kbps"]], 6114],
          "rgba(237, 169, 104,1)",
          ["<=", ["to-number", ["get", "avg_d_kbps"]], 12288],
          "rgba(237, 196, 62,1)",
          ["<=", ["to-number", ["get", "avg_d_kbps"]], 24576],
          "rgba(198, 237, 154, 1)",
          ["<=", ["to-number", ["get", "avg_d_kbps"]], 49152],
          "rgba(141, 237, 126, 1)",
          ["<=", ["to-number", ["get", "avg_d_kbps"]], 98304],
          "rgba(90, 237, 102, 1)",
          ["<=", ["to-number", ["get", "avg_d_kbps"]], 393216],
          "rgba(0, 237, 32, 1)",
          ["<=", ["to-number", ["get", "avg_d_kbps"]], 1024000],
          "rgba(0, 178, 237, 1)",
          ["<=", ["to-number", ["get", "avg_d_kbps"]], 2100000],
          "rgba(0, 40, 237, 1)",
          "rgba(0,0,0,1)"
        ],
        "fill-outline-color": "rgba(0,0,0,1)"
      }
    });
  });
  ElMessage({
    showClose: true,
    message: "由于服务器配置低（cpu、带宽），数据生成与传输相对较慢"
  });
});

onBeforeUnmount(() => {
  if (map) {
    map.remove(); // 销毁 Mapbox 实例
  }
});

const initMap = () => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiMjQyNzMyNDY1MyIsImEiOiJja3VqbzZ1YWIyenQ0MnFtYTZidmVtcGZxIn0.ac02aZcfccK4nm0_cfEyDg";
  return new mapboxgl.Map({
    container: "map",
    // style: 'mapbox://styles/mapbox/light-v10',
    style: "mapbox://styles/mapbox/light-v11",
    center: [113.264434, 23.129162],
    zoom: 3,
    minZoom: 2,
    maxZoom: 15
    // antialias: true
    // pitch: 65,
  });
};

const language = new MapboxLanguage({
  defaultLanguage: "zh-Hans"
});
</script>
<template>
  <!-- <div v-loading="loading"
        element-loading-text="Loading..."
        element-loading-background="rgba(0, 0, 0, 0.8)"> -->
  <div>
    <div id="map" class="map"></div>
    <el-collapse class="collapse" accordion>
      <el-collapse-item>
        <template #title>
          <span style="margin-left: 38px; font-size: 125%; font-weight: bold"
            >全球网络性能指标动态格网统计分析</span
          >
        </template>
        <div class="decrip">
          •
          格网图说明：此六边形格网描述了全球固定宽带（WIFI，以太网）的网络性能指标，此处只描述了下载速度，六边形网格聚合计算了该区域内的平均网络性能指标。
        </div>
        <div class="decrip">
          • 数据源：<el-link
            href="https://github.com/teamookla/ookla-open-data"
            target="_blank"
            type="primary"
            >ookla-open-data</el-link
          >,数据更新时间2022年7月1日。
        </div>
        <div class="decrip">
          • 数据说明：下载速度、上传速度和延迟数据是源于 Ookla
          的全球著名网络测试程序 Speedtest 收集而来，Speedtest
          数据如今被世界各地的商业固定和移动网络运营商用于通知网络建设、提高全球互联网质量和增加互联网可访问性。Ookla
          将数据授权给非政府组织和教育机构以履行其使命：帮助每个人更好、更快和更方便地访问互联网。
          Ookla
          希望通过分发数据来进一步实现这一使命，使个人和组织更容易使用它来弥合拥有和没有现代互联网接入的人们之间的社会和经济差距。
        </div>
      </el-collapse-item>
    </el-collapse>
    <el-card class="box-card">
      <img class="img" src="./../assets/img/图例2.svg" alt="图例" />
    </el-card>
  </div>
  <!-- </div> -->
</template>

<style scoped lang="scss">
.map {
  height: 100vh;
  // width: 100%;
}
.collapse {
  position: absolute;
  z-index: 10;
  color: #2a2b2e;
  border-right: 1px solid var(--el-collapse-border-color);
  border-left: 1px solid var(--el-collapse-border-color);
  width: 350px;
  top: 13px;
  right: 13px;
  .decrip {
    margin-left: 13px;
    font-size: 13px;
  }
}
.box-card {
  position: absolute;
  z-index: 10;
  width: 170px;
  bottom: 25px;
  right: 15px;
  padding: 0;
  .img {
    height: 260px;
    // margin: 2px;
  }
}
</style>
