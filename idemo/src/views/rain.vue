<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import {ref, reactive, onMounted} from "vue";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import Map from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import {fromLonLat, getTransform} from "ol/proj";
import VectorSource from "ol/source/Vector";
import {Fill, Stroke, Style} from "ol/style";
import axios from "axios";
import {ElMessage} from "element-plus";
import XYZ from "ol/source/XYZ";

let loading = ref(false);
const options = reactive([
  {
    value: 24,
    label: "24小时"
  },
  {
    value: 48,
    label: "48小时"
  },
  {
    value: 72,
    label: "72小时"
  }
]);
const cur = ref(24);
//雨水等级
const rainLevel = reactive({
  0: "小雨",
  2.5: "小雨",
  5: "小雨",
  10: "中雨",
  25: "大雨",
  50: "暴雨",
  100: "大暴雨",
  250: "特大暴雨"
});

let vectorLayer = reactive({});

onMounted(() => {
  vectorLayer = new VectorLayer({
    source: new VectorSource(),
    style: feature => {
      // 根据参数自定义显示label和图层颜色，使得不同雨量级别的Feature显示不同颜色
      return genStyle(feature.get("color"));
    }
  });
  initMap();
  displayRainPublic(cur.value);
});

const initMap = () => {
  const baseLayer = new TileLayer({
    source: new XYZ({
      url: "http://t0.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=bc1039e48ae2d6e8ee53afdb8a603e96"
    })
  });
  const textLayer = new TileLayer({
    source: new XYZ({
      url: "http://t0.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=bc1039e48ae2d6e8ee53afdb8a603e96"
    })
  });

  return new Map({
    target: "map",
    layers: [baseLayer, textLayer, vectorLayer],
    view: new View({
      center: fromLonLat([104.06, 30.67]),
      zoom: 4,
      minZoom: 1,
      maxZoom: 18
    })
  });
};

const genStyle = g => {
  //根据雨量大小定义矢量图层显示样式
  return new Style({
    fill: new Fill({
      color: "rgba(" + g + ", 0.6)"
    }),
    stroke: new Stroke({
      color: "#319FD3",
      width: 1
    })
  });
};
//获取雨水数据并渲染
const displayRainPublic = a => {
  loading.value = true;
  axios({
    url: "/Api/LeastRain/" + a,
    method: "get",
    responseType: "json"
  }).then(a => {
    // console.log(JSON.parse(a.data.contours));//查看数据结构来解析
    let b, c, d, e, f, g;
    vectorLayer.getSource().clear();
    //根据获取的数据解析数据
    for (b = JSON.parse(a.data.contours), c = 0; c < b.length; c++) {
      for (d = [], e = b[c], f = 0; f < e.latAndLong.length; f++) {
        d.push([e.latAndLong[f][1], e.latAndLong[f][0]]);
      }
      g = b[c].color.substring(0, b[c].color.lastIndexOf(","));
      // console.log(b)
      let polygon = new Polygon([d]);
      polygon.applyTransform(getTransform("EPSG:4326", "EPSG:3857"));
      let feature = new Feature({
        geometry: polygon,
        rainLevel: rainLevel[e.symbol],
        color: g
      });
      vectorLayer.getSource().addFeature(feature);
    }
    const key = vectorLayer.on("postrender", () => {
      loading.value = false;
      ElMessage({
        type: "success",
        message: "数据来源中央气象台，发布时间" + a.data.time
      });
      vectorLayer.un(key.type, key.listener);
    });
  });
};
</script>
<template>
  <div
    v-loading="loading"
    element-loading-text="Loading..."
    element-loading-background="rgba(0, 0, 0, 0.8)"
  >
    <div id="map" class="map">
      <el-select
        v-model="cur"
        class="sel"
        placeholder="请选中未来时段查看雨情"
        size="large"
        @change="displayRainPublic(cur)"
      >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
  </div>
</template>

<style scoped>
.map {
  height: 100vh;
  width: 100%;
}
.sel {
  position: absolute;
  right: 35px;
  top: 19px;
  z-index: 10;
  color: #fff;
}
</style>
