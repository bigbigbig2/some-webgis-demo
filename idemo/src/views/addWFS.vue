<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    v-loading="loading"
    element-loading-text="Loading..."
    element-loading-background="rgba(0, 0, 0, 0.8)"
  >
    <div id="map" class="map" :style="{height: this.height}">
      <el-button type="info" class="serach" @click="queryWfs">
        要素查询 <el-icon><search /></el-icon>
      </el-button>
      <el-checkbox
        id="check1"
        v-model="checked1"
        :checked="checked1"
        label="新增"
        border
        size="small"
        @click="addFeature"
      />
      <el-button type="info" id="save" @click="save">
        保存修改 <el-icon><finished /></el-icon>
      </el-button>
    </div>
  </div>
</template>

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
import {Search, Finished} from "@element-plus/icons-vue";
import Draw from "ol/interaction/Draw";
import Feature from "ol/Feature";
import WFS from "ol/format/WFS";
import MultiLineString from "ol/geom/MultiLineString";
import LineString from "ol/geom/LineString.js";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "night",
  components: {Search, Finished},
  data() {
    return {
      map: {},
      height: window.innerHeight + "px",
      checked1: false,
      loading: false,
      newId: 1,
      wfsVectorLayer: null,
      drawedFeature: null, //保存绘制结束时暂存绘制的feature
      drawInteraction: {}, //保存绘制新图形的interaction，用于添加新的线条
      drawLayer: null
    };
  },
  created() {},
  mounted() {
    //保存用于新绘制feature的layer
    this.drawLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({
          color: "blue",
          width: 5
        })
      })
    });
    this.drawInteraction = new Draw({
      type: LineString,
      style: new Style({
        stroke: new Stroke({
          color: "red",
          width: 5
        })
      }),
      source: this.drawLayer.getSource(), //把绘制后的要素添加到这个源（图层中）中
      geometryName: "the_geom"
    });
    this.drawInteraction.on("drawend", e => {
      this.drawedFeature = e.feature;
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
        layers: [baseLayer, this.drawLayer],
        view: new View({
          center: [113.292464, 23.097931],
          projection: "EPSG:4326",
          zoom: 17,
          minZoom: 1,
          maxZoom: 18
        })
      });
      return map;
    },
    queryWfs() {
      // if(this.map.getAllLayers()[1]){
      // ElMessage.error('要素已存在，无法再次加载');
      // }else{
      this.loading = true;
      // setTimeout(()=>this.loading=false,1000)
      var roadLayer = new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON({
            geometryName: "the_geom"
          }),
          url: "http://47.115.200.215:8080/geoserver/wfs?service=wfs&version=1.1.0&request=GetFeature&typeNames=webgis_demo:wfs_gz_roads&outputFormat=application/json&srsname=EPSG:4326"
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
      roadLayer.on("postrender", () => {
        this.loading = false;
      });
      this.map.addLayer(roadLayer);

      // }
    },
    addFeature() {
      if (!this.checked1) {
        // 勾选新增复选框时，添加绘制的Interaction
        // this.map.removeInteraction(this.drawInteraction);
        this.map.addInteraction(this.drawInteraction);
      } else {
        // 取消勾选新增复选框时，移出绘制的Interaction，删除已经绘制的feature
        this.map.removeInteraction(this.drawInteraction);
        if (this.drawedFeature) {
          this.drawLayer.getSource().removeFeature(this.drawedFeature);
        }
        this.drawedFeature = null;
      }
    },
    save() {
      //转换坐标
      var geometry = this.drawedFeature.getGeometry().clone(); //拷贝一份几何要素出来
      geometry.applyTransform(
        function (flatCoordinates, flatCoordinates2, stride) {
          for (var j = 0; j < flatCoordinates.length; j += stride) {
            var y = flatCoordinates[j];
            var x = flatCoordinates[j + 1];
            flatCoordinates[j] = x;
            flatCoordinates[j + 1] = y;
          }
        }
      );
      // 设置feature对应的属性，这些属性是根据数据库的字段来设置的
      var newFeature = new Feature();
      newFeature.setId("wfs_gz_roads.new." + this.newId);
      newFeature.setGeometryName("geom");
      newFeature.set("the_geom", null);
      newFeature.set("name", "");
      newFeature.set("fid_lines", 222);
      newFeature.set("osm_id", 1);
      newFeature.set("highway", "");
      newFeature.set("waterway", "");
      newFeature.set("gid", this.newId);
      newFeature.set("aerialway", "");
      newFeature.set("barrier", "");
      newFeature.set("man_made", "");
      newFeature.set("z_order", 0);
      newFeature.set("other_tags", "");
      newFeature.setGeometry(new MultiLineString([geometry.getCoordinates()]));

      this.addWfs([newFeature]);
      // 更新id
      this.newId = this.newId + 1;
    },
    //将绘制的图添加服务器
    addWfs(features) {
      var WFSTSerializer = new WFS();
      var featObject = WFSTSerializer.writeTransaction(features, null, null, {
        featureType: "wfs_gz_roads",
        featureNS: "http://webgis_demo",
        srsName: "EPSG:4326"
      });
      var serializer = new XMLSerializer();
      var featString = serializer.serializeToString(featObject);
      var request = new XMLHttpRequest();
      request.open(
        "POST",
        "http://47.115.200.215:8080/geoserver/wfs?service=wfs"
      );
      request.setRequestHeader("Content-Type", "text/xml");
      request.send(featString);
    }
  }
};
</script>

<style scoped>
.map {
  height: 900px;
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
