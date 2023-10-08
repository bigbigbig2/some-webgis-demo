<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import {onMounted, onBeforeUnmount} from "vue";
// import {ElMessage} from "element-plus";
import mapboxgl from "mapbox-gl";
import "@/assets/style/mapbox-gl.css";

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
  // 使用webgl2进行自定义图层开发，因为默认为是webgl1，这里只需在声明Map对象前修改下它的context：即可
  if (
    mapboxgl.Map.prototype._setupPainter.toString().indexOf("webgl2") == 289
  ) {
    var _setupPainter_old = mapboxgl.Map.prototype._setupPainter;
    mapboxgl.Map.prototype._setupPainter = function () {
      var getContext_old = this._canvas.getContext;
      this._canvas.getContext = function (attrib) {
        return (
          getContext_old.apply(this, ["webgl2", attrib]) ||
          getContext_old.apply(this, ["webgl", attrib]) ||
          getContext_old.apply(this, ["experimental-webgl", attrib])
        );
      };
      _setupPainter_old.apply(this);
      this._canvas.getContext = getContext_old;
    };
  }

  map = new mapboxgl.Map({
    container: "map",
    zoom: 4.5,
    center: [103.5, 34],
    bearing: -45,
    pitch: 55,
    style: "mapbox://styles/mapbox/dark-v10",
    antialias: true
  });

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

    const vs = `#version 300 es
			precision highp float;
			uniform mat4 u_matrix;
			layout(location=0) in vec3 a_pos;
			void main(){
				gl_Position = u_matrix * vec4(a_pos,1.0);
			}
		`;
    const fs = `#version 300 es
			precision highp float;
			out vec4 outColor;
			void main(){
				outColor = vec4(0.1,0.7,0.3,0.5);
			}
		`;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vs);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fs);
    gl.compileShader(fragmentShader);

    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    //将经纬度坐标转直接转为裁剪空间坐标[0,1],也就意味着不用自己实现投影矩阵了
    const positions = new Float32Array(this.coors.length);
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
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    // 开启深度测试
    gl.enable(gl.DEPTH_TEST);
  }
  //离屏渲染（帧缓冲区）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prerender(gl, matrix) {
    //console.log(gl,matrix);
  }
  render(gl, matrix) {
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.uniformMatrix4fv(
      gl.getUniformLocation(this.program, "u_matrix"),
      false,
      matrix
    );
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.LINE_STRIP, 0, this.coors.length / 3);

    gl.bindVertexArray(null);
  }
  //资源回收
  onRemove(map, gl) {
    gl.deleteProgram(this.program);
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
