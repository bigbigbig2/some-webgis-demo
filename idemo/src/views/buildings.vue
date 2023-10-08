<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import {ref, onMounted, onBeforeUnmount} from "vue";
// import {ElMessage} from "element-plus";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import "./../assets/style/mapbox-gl.css";
// import {MapboxOverlay} from '@deck.gl/mapbox/typed';
import {MapboxLayer} from "@deck.gl/mapbox/typed";
import {MVTLayer} from "@deck.gl/geo-layers/typed";
import {LayerExtension} from "@deck.gl/core/typed";
import axios from "axios";

let map;

const props = {
  expandTrigger: "hover"
};

const options = [
  {
    value: "广西省",
    label: "广西省",
    children: [
      {
        value: "桂林市",
        label: "桂林市"
      }
    ]
  },
  {
    value: "广东省",
    label: "广东省",
    children: [
      {
        value: "广州市",
        label: "广州市"
      },
      {
        value: "东莞市",
        label: "东莞市"
      },
      {
        value: "佛山市",
        label: "佛山市"
      },
      {
        value: "珠海市",
        label: "珠海市"
      }
    ]
  },
  {
    value: "澳门特别行政区",
    label: "澳门特别行政区",
    children: [
      {
        value: "澳门特别行政区",
        label: "澳门特别行政区"
      }
    ]
  },
  {
    value: "北京市",
    label: "北京市",
    children: [
      {
        value: "北京市",
        label: "北京市"
      }
    ]
  },
  {
    value: "河北省",
    label: "河北省",
    children: [
      {
        value: "保定市",
        label: "保定市"
      },
      {
        value: "沧州市",
        label: "沧州市"
      }
    ]
  },
  {
    value: "内蒙古自治区",
    label: "内蒙古自治区",
    children: [
      {
        value: "包头",
        label: "包头"
      }
    ]
  },
  {
    value: "江苏省",
    label: "江苏省",
    children: [
      {
        value: "常州市",
        label: "常州市"
      }
    ]
  },
  {
    value: "四川省",
    label: "四川省",
    children: [
      {
        value: "成都市",
        label: "成都市"
      },
      {
        value: "广元市",
        label: "广元市"
      }
    ]
  },
  {
    value: "辽宁省",
    label: "辽宁省",
    children: [
      {
        value: "大连市",
        label: "大连市"
      }
    ]
  },
  {
    value: "福建省",
    label: "福建省",
    children: [
      {
        value: "福州市",
        label: "福州市"
      }
    ]
  },
  {
    value: "贵州省",
    label: "贵州省",
    children: [
      {
        value: "贵阳市",
        label: "贵阳市"
      }
    ]
  },
  {
    value: "黑龙江省",
    label: "黑龙江省",
    children: [
      {
        value: "哈尔滨市",
        label: "哈尔滨市"
      }
    ]
  },
  {
    value: "海南省",
    label: "海南省",
    children: [
      {
        value: "海口市",
        label: "海口市"
      }
    ]
  },
  {
    value: "浙江省",
    label: "浙江省",
    children: [
      {
        value: "杭州市",
        label: "杭州市"
      }
    ]
  },
  {
    value: "安徽省",
    label: "安徽省",
    children: [
      {
        value: "合肥市",
        label: "合肥市"
      }
    ]
  }
];

const value1 = ref(false);

const fillColor = ref("rgba(220, 220, 220, 150)");
// const lineColor = ref("rgba(0,0,0)");
const buildingHeight = ref(5);

class Custom extends LayerExtension {
  getShaders() {
    return {
      inject: {
        "vs:#decl": `
              varying vec2 vPosition;
          `,
        "vs:#main-end": `
              vPosition = vertexPositions;
          `,
        "fs:#decl": `
              varying vec2 vPosition;
          `,
        //重写颜色绘制函数
        "fs:DECKGL_FILTER_COLOR": `
              // color = vec4(color.rgb, color.a )
              color = vec4(color.r* pow(1.0-vPosition.y,1.0),color.g* pow(1.0-vPosition.y,1.0),color.b, color.a);
          `
      }
    };
  }
}

const mvtLayer = new MapboxLayer({
  id: "gl-building-mtv",
  type: MVTLayer,
  // data:`http://175.178.49.159:7800/public.china_buildings1/{z}/{x}/{y}.pbf`,
  data: `http://175.178.49.159/static/China-buildings/{z}/{x}/{y}.pbf`,
  minZoom: 2,
  maxZoom: 16,
  getFillColor: [17, 179, 68, 150],
  lineWidthMinPixels: 0.5,
  pickable: true,
  extruded: true,
  autoHighlight: true,
  highlightColor: [0, 245, 255, 100],
  getElevation: d => d.properties.Elevation,
  wireframe: false,
  getLineColor: [105, 160, 126, 1],
  // material: {
  //   ambient: 0.1,
  //   diffuse: 0.9,
  //   shininess: 32,
  //   specularColor: [30, 30, 30]
  // },
  extensions: [new Custom()]
});

onMounted(() => {
  map = initMap(); //标记为非响应式
  map.addControl(language);
  map.on("load", () => {
    map.addLayer(mvtLayer);
  });
});

onBeforeUnmount(() => {
  if (map) {
    map.remove(); // 销毁 Mapbox 实例
  }
});

const rgba2arr = rgbaStr => {
  const rgbaArr = rgbaStr
    .substring(5, rgbaStr.length - 1)
    .split(", ")
    .map(Number);
  return rgbaArr;
};

const buildingStyleFill = () => {
  mvtLayer.setProps({
    getFillColor: rgba2arr(fillColor.value)
  });
};

const buildingStyleHeight = () => {
  mvtLayer.setProps({
    getElevation: d => d.properties.Elevation * 0.2 * buildingHeight.value
  });
};

const buildingStyleLine = () => {
  mvtLayer.setProps({
    wireframe: value1.value
  });
};

const initMap = () => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiMjQyNzMyNDY1MyIsImEiOiJja3VqbzZ1YWIyenQ0MnFtYTZidmVtcGZxIn0.ac02aZcfccK4nm0_cfEyDg";
  return new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v10",
    // projection: '',
    // style: "mapbox://styles/mapbox/dark-v10",
    center: [113.264434, 23.129162],
    zoom: 16,
    // minZoom:2,
    // maxZoom:16,
    // antialias: true
    pitch: 65
  });
};

const language = new MapboxLanguage({
  defaultLanguage: "zh-Hans"
});

//高德地图地理编码器API
const handleChange = value => {
  axios({
    url: `https://restapi.amap.com/v3/geocode/geo?address=${value[1]}&output=JSON&key=6b32e5843ddb6e9d89b792fc7aa6a836`,
    method: "get"
  }).then(result => {
    flyto(result.data.geocodes[0].location.split(","));
  });
};

const flyto = center => {
  map.flyTo({
    center: center,
    zoom: 16,
    essential: true // this animation is considered essential with respect to prefers-reduced-motion
  });
};

// const addMvtBuildings = map => {
//   // console.log(getFillColor.value)
// };
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
          <span style="margin-left: 18px; font-size: 115%; font-weight: bold"
            >77座城市建筑物</span
          >
        </template>
        <div style="margin-left: 13px; font-size: 105%">
          部分城市选择：
          <el-cascader
            v-model="options.value"
            :options="options"
            :props="props"
            @change="handleChange"
          />
        </div>
        <div class="demo-color-block">
          <span class="demonstration">建筑颜色及透明度选择器：</span>
          <el-color-picker
            size="small"
            v-model="fillColor"
            show-alpha
            color-format="rgb"
            @change="buildingStyleFill"
          />
        </div>
        <div class="demo-color-block">
          <span class="demonstration">是否显示建筑物轮廓</span>
          <el-switch @change="buildingStyleLine" v-model="value1" />
        </div>
        <div>
          <span style="margin-left: 13px; font-size: 105%"
            >建筑物高度拉升(5为原始高度)：</span
          >
          <el-slider
            style="margin-left: 13px; margin-right: 13px"
            v-model="buildingHeight"
            @change="buildingStyleHeight()"
          />
        </div>
        <br />
        <div style="margin-left: 10px">
          数据说明：此77个城市的带高度字段建筑物矢量面数据来源于网络分享（小呲花处理，原始数据来源环哥），共9325760个面要素
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>

  <!-- </div> -->
</template>

<style scoped lang="scss">
.map {
  height: 100vh;
  width: 100%;
}
.collapse {
  position: absolute;
  z-index: 10;
  color: #2a2b2e;
  width: 350px;
  top: 13px;
  right: 13px;
  border-right: 1px solid var(--el-collapse-border-color);
  border-left: 1px solid var(--el-collapse-border-color);
  .demo-color-block {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    margin-top: 7px;
    .demonstration {
      margin-left: 13px;
      margin-right: 13px;
      font-size: 105%;
    }
  }
}
</style>
