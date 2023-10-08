<script>
import TileLayer from "ol/layer/Tile";
// import VectorLayer from 'ol/layer/Vector';
import Map from "ol/Map";
import View from "ol/View";
import XYZ from "ol/source/XYZ";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import {Search} from "@element-plus/icons-vue";
import WFS from "ol/format/WFS";
import Select from "ol/interaction/Select";

import {ElMessage} from "element-plus";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "night",
  components: {Search},
  data() {
    return {
      map: {},
      checked1: false,
      loading: false,
      wfsVectorLayer: null
    };
  },
  created() {},
  mounted() {
    this.selectInteraction = new Select({
      style: new Style({
        stroke: new Stroke({
          color: "red",
          width: 5
        })
      })
    });
    this.map = this.initMap();
  },
  methods: {
    initMap() {
      var baseLayer = new TileLayer({
        source: new XYZ({
          url: "http://t0.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=bc1039e48ae2d6e8ee53afdb8a603e96"
        })
      });
      var map = new Map({
        target: "map",
        layers: [baseLayer],
        view: new View({
          center: [113.292464, 23.099691],
          projection: "EPSG:4326",
          zoom: 17,
          minZoom: 1,
          maxZoom: 18
        })
      });
      return map;
    },
    queryWfs() {
      if (this.map.getAllLayers()[1]) {
        ElMessage.error("要素已存在，无法再次加载");
      } else {
        this.loading = true;
        var roadLayer = new VectorLayer({
          source: new VectorSource({
            format: new GeoJSON({
              geometryName: "the_geom"
            }),
            url: "http://175.178.49.159:8888/geoserver/wfs?service=wfs&version=1.1.0&request=GetFeature&typeNames=webgis_demo:wfs_gz_roads_small&outputFormat=application/json&srsname=EPSG:4326"
          }),
          style: function () {
            return new Style({
              stroke: new Stroke({
                color: "orange",
                width: 5
              })
            });
          }
        });
        //这里注意，如果回调函数使用的是function(){}表达式则无法修改外部的loading，只能读取到。
        this.map.addLayer(roadLayer);
        //这里注意，如果回调函数使用的是function(){}表达式则无法修改外部的loading，只能读取到。
        roadLayer.getSource().on("change", () => {
          if (roadLayer.getSource().getState() === "ready") {
            this.loading = false;
          }
        });
      }
    },
    selectFeature() {
      if (!this.checked1) {
        this.map.removeInteraction(this.selectInteraction);
        this.map.addInteraction(this.selectInteraction);
      } else {
        this.map.removeInteraction(this.selectInteraction);
      }
    },
    onDeleteFeature() {
      // 删选择器选中的feature
      if (this.selectInteraction.getFeatures().getLength() > 0) {
        this.deleteWfs([this.selectInteraction.getFeatures().item(0)]);
      }
    },
    //在服务器端删除feature
    deleteWfs(features) {
      var WFSTSerializer = new WFS();
      var featObject = WFSTSerializer.writeTransaction(null, null, features, {
        featureType: "wfs_gz_roads_small",
        featureNS: "http://webgis_demo",
        srsName: "EPSG:4326"
      });
      var serializer = new XMLSerializer();
      var featString = serializer.serializeToString(featObject);
      var request = new XMLHttpRequest();
      request.open(
        "POST",
        "http://175.178.49.159:8888/geoserver/wfs?service=wfs"
      );
      request.setRequestHeader("Content-Type", "text/xml");
      request.send(featString);
      request.onload = () => {
        this.loading = false;
        if (request.status === 200) {
          ElMessage({
            type: "info",
            message: "删除成功，正在刷新页面"
          });
          location.reload();
          // ElMessageBox.confirm(
          //   "删除成功！是否重新加载页面?（重加载页面后再查询要素便是修改后的要素了）",
          //   "提示",
          //   {
          //     confirmButtonText: "是",
          //     cancelButtonText: "否",
          //     type: "success"
          //   }
          // )
          //   .then(() => {
          //     location.reload();
          //   })
          //   .catch(() => {
          //     ElMessage({
          //       type: "info",
          //       message: "取消成功"
          //     });
          //   });
        }
      };
    }
  }
};
</script>

<template>
  <div
    v-loading="loading"
    element-loading-text="Loading..."
    element-loading-background="rgba(0, 0, 0, 0.8)"
  >
    <div id="map" class="map">
      <el-button type="info" class="serach" @click="queryWfs">
        要素查询 <el-icon><search /></el-icon>
      </el-button>
      <el-checkbox
        id="check1"
        v-model="checked1"
        :checked="checked1"
        label="选择"
        border
        size="small"
        @click="selectFeature"
      />
      <el-button type="info" id="save" @click="onDeleteFeature">
        删除选中要素
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.map {
  height: 100vh;
  width: 100%;
}
.serach {
  position: absolute;
  right: 15px;
  top: 15px;
  z-index: 10;
  color: aliceblue;
}
button.el-button.el-button--info.serach {
  color: #fff;
  background-color: #2a2b2e;
  border: none;
}

#check1 {
  position: absolute;
  right: 145px;
  top: 19px;
  z-index: 10;
  color: aliceblue;
}

button#save {
  position: absolute;
  right: 235px;
  top: 15px;
  z-index: 10;
  color: aliceblue;
  color: #fff;
  background-color: #2a2b2e;
  border: none;
}
</style>
