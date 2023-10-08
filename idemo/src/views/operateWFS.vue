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
import Select from "ol/interaction/Select";
import Modify from "ol/interaction/Modify";
import {Search, Finished} from "@element-plus/icons-vue";
import WFS from "ol/format/WFS";
import {ElMessage} from "element-plus";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "night",
  components: {Search, Finished},
  data() {
    return {
      map: {},
      checked1: false,
      checked2: false,
      modifyInteraction: {},
      modifiedFeatures: null,
      wfsVectorLayer: null,
      selectInteraction: {},
      loading: false
    };
  },
  created() {},
  mounted() {
    this.map = this.initMap();
    //一个选择要素事件，可以给相应的事件添加监听
    this.selectInteraction = new Select({
      style: new Style({
        stroke: new Stroke({
          color: "red",
          width: 4
        })
      })
    });
    //一个修改器事件
    this.modifyInteraction = new Modify({
      style: new Style({
        stroke: new Stroke({
          color: "red",
          width: 4
        })
      }),
      features: this.selectInteraction.getFeatures() //获取选择的要素
    });

    this.modifyInteraction.on("modifyend", e => {
      // 把修改后的feature暂存起来
      this.modifiedFeatures = e.features;
    });
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
      // console.log(this.checked1)
      //这里需要注意有一个小坑，点击复选框时是false，这里按的是点击前的值，使用需要取反。。
      if (!this.checked1) {
        this.map.removeInteraction(this.selectInteraction);
        this.map.addInteraction(this.selectInteraction);
      } else {
        //不勾选的情况下,移除修改器和选择器
        this.map.removeInteraction(this.selectInteraction);
        this.map.removeInteraction(this.modifyInteraction);
        this.modifiedFeatures = null;
      }
    },
    editFeature() {
      //勾选编辑要素复选框时，添加选择器和修改器到地图
      if (!this.checked2) {
        this.map.removeInteraction(this.modifyInteraction);
        this.map.addInteraction(this.modifyInteraction);
        this.map.removeInteraction(this.selectInteraction);
        this.map.addInteraction(this.selectInteraction);
      } else {
        this.map.removeInteraction(this.modifyInteraction);
        this.modifiedFeatures = null;
      }
    },
    save() {
      this.loading = true;
      if (this.modifiedFeatures && this.modifiedFeatures.getLength() > 0) {
        //转换坐标，先克隆一份要素出来（深拷贝）
        var modifiedFeature = this.modifiedFeatures.item(0).clone();
        //注意ID是必须，通过ID才能找到对应修改的feature
        modifiedFeature.setId(this.modifiedFeatures.item(0).getId());
        //调换经纬度坐标，以符合wfs协议中经纬度的位置
        modifiedFeature
          .getGeometry()
          .applyTransform(function (flatCoordinates, flatCoordinates2, stride) {
            for (var j = 0; j < flatCoordinates.length; j += stride) {
              var y = flatCoordinates[j];
              var x = flatCoordinates[j + 1];
              flatCoordinates[j] = x;
              flatCoordinates[j + 1] = y;
            }
          });
        this.modifyWfs([modifiedFeature]);
      }
    },
    modifyWfs(features) {
      var WFSTSerializer = new WFS();
      var featObject = WFSTSerializer.writeTransaction(null, features, null, {
        featureType: "wfs_gz_roads_small",
        featureNS: "http://webgis_demo", // 注意这个值必须为创建工作区时的命名空间URI
        srsName: "EPSG:4326"
      });
      // 转换为xml内容发送到服务器端（发送的是xml格式的请求）
      var serializer = new XMLSerializer();
      var featString = serializer.serializeToString(featObject);
      var request = new XMLHttpRequest();
      request.open(
        "POST",
        "http://175.178.49.159:8888/geoserver/wfs?service=wfs"
      );
      // 指定内容为xml类型
      request.setRequestHeader("Content-Type", "text/xml");
      request.send(featString);
      request.onload = () => {
        this.loading = false;
        if (request.status === 200) {
          ElMessage({
            type: "info",
            message: "修改成功，正在刷新页面"
          });
          location.reload();
          // ElMessageBox.confirm(
          //   "保存成功！是否重新加载页面?（重加载页面后再查询要素便是修改后的要素了）",
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
    div
    id="map"
    class="map"
    v-loading="loading"
    element-loading-text="Loading..."
    element-loading-background="rgba(0, 0, 0, 0.8)"
  >
    <el-button type="info" class="serach" @click="queryWfs">
      要素查询 <el-icon><search /></el-icon>
    </el-button>
    <el-checkbox
      id="check1"
      v-model="checked1"
      :checked="checked1"
      label="选择要素"
      border
      size="small"
      @click="selectFeature"
    />
    <el-checkbox
      id="check2"
      v-model="checked2"
      :checked="checked2"
      label="编辑要素"
      border
      size="small"
      @click="editFeature"
    />
    <el-button type="info" id="save" @click="save">
      保存修改 <el-icon><finished /></el-icon>
    </el-button>
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
  right: 115px;
  top: 19px;
  z-index: 10;
  color: aliceblue;
}
#check2 {
  position: absolute;
  right: 260px;
  top: 19px;
  z-index: 10;
  color: aliceblue;
}
button#save {
  position: absolute;
  right: 380px;
  top: 15px;
  z-index: 10;
  color: aliceblue;
  color: #fff;
  background-color: #2a2b2e;
  border: none;
}
</style>
