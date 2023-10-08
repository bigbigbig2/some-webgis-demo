<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import {onMounted, onBeforeUnmount} from "vue";
// import {ElMessage} from "element-plus";
import mapboxgl from "mapbox-gl";
import "@/assets/style/mapbox-gl.css";
import createREGL from "regl";

let map;

onMounted(() => {
  initMap();
});

onBeforeUnmount(() => {
  if (map) {
    map.remove(); // 销毁 Mapbox 实例
  }
});

const initMap = () => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiMjQyNzMyNDY1MyIsImEiOiJja3VqbzZ1YWIyenQ0MnFtYTZidmVtcGZxIn0.ac02aZcfccK4nm0_cfEyDg";

  map = new mapboxgl.Map({
    container: "map",
    zoom: 4.5,
    center: [103.5, 34],
    bearing: -45,
    pitch: 55,
    style: "mapbox://styles/mapbox/dark-v10",
    antialias: true
  });
  console.log(map);

  //直接将在上面绘制的webgl 图形作为自定义样式图层添加到map中
  const layer = new customLayer();

  map.on("load", () => {
    map.addLayer(layer);
  });
};

class customLayer {
  constructor() {
    this.id = "customLayer";
    this.type = "custom";
    this.renderingMode = "3d";
  }
  onAdd(map, gl) {
    this.coors = [
      86.753, 36.233, 0, 86.735, 33.233, 100000, 92.735, 33.233, 500000, 92.735,
      36.266, 100000, 98.753, 36.266, 500000, 98.753, 33.233, 600000, 104.753,
      33.233, 400000, 104.753, 36.266, 700000, 110.753, 36.266, 800000, 110.753,
      33.233, 400000, 116.753, 33.233, 300000, 116.753, 36.266, 100000
    ];

    //将经纬度坐标转直接转为裁剪空间坐标[0,1],也就意味着不用自己实现投影矩阵了
    // const positions = new Float32Array(this.coors.length);
    const positions = [];
    for (let i = 0; i < this.coors.length; i = i + 3) {
      const web_mkd_coor = mapboxgl.MercatorCoordinate.fromLngLat(
        {
          lng: this.coors[i],
          lat: this.coors[i + 1]
        },
        this.coors[i + 2]
      );
      positions[i] = web_mkd_coor.x;
      positions[i + 1] = web_mkd_coor.y;
      positions[i + 2] = web_mkd_coor.z;
    }
    console.log(positions);
    this.regl = createREGL({
      gl: gl
    });
    // console.log("regl",regl);
    this.draw = this.regl({
      frag: `
			precision mediump float;
			void main(){
				gl_FragColor = vec4(0.1,0.7,0.3,0.5);
			}`,

      vert: `
			precision highp float;
			uniform mat4 u_matrix;
			attribute vec3 a_pos;
			void main(){
				gl_Position = u_matrix * vec4(a_pos,1.0);
			}
		`,
      attributes: {
        a_pos: positions
      },
      uniforms: {
        u_matrix: this.regl.prop("u_matrix")
      },
      primitive: "line strip",
      count: 12,

      depth: {
        enable: true
      }
    });
  }
  //离屏渲染（帧缓冲区）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prerender(gl, matrix) {}
  render(gl, matrix) {
    this.draw({
      u_matrix: matrix
    });
  }
  //资源回收
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemove(map, gl) {
    // gl.deleteProgram(this.program);
  }
}
</script>

<template>
  <div>
    <div id="map" class="map"></div>
  </div>
</template>

<style scoped lang="scss">
.map {
  height: 100vh;
  width: 100%;
}
</style>
