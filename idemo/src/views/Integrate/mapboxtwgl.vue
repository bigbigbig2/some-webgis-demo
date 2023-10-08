<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import {onMounted, onBeforeUnmount} from "vue";
import mapboxgl from "mapbox-gl";
import "@/assets/style/mapbox-gl.css";
import {
  createProgramInfo,
  createBufferInfoFromArrays,
  setUniforms,
  setBuffersAndAttributes,
  drawBufferInfo
} from "twgl.js";

let map;

onMounted(() => {
  initMap();
  console.log(performance.now());
});

onBeforeUnmount(() => {
  if (map) {
    map.remove(); // 销毁 Mapbox 实例
  }
});

let startTime = performance.now();

const initMap = () => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiMjQyNzMyNDY1MyIsImEiOiJja3VqbzZ1YWIyenQ0MnFtYTZidmVtcGZxIn0.ac02aZcfccK4nm0_cfEyDg";
  // 使用webgl2进行自定义图层开发，因为默认为是webgl1，这里只需在声明Map对象前修改下它的context：即可
  // if (
  //   mapboxgl.Map.prototype._setupPainter.toString().indexOf("webgl2") == 289
  // ) {
  //   var _setupPainter_old = mapboxgl.Map.prototype._setupPainter;
  //   mapboxgl.Map.prototype._setupPainter = function () {
  //     var getContext_old = this._canvas.getContext;
  //     this._canvas.getContext = function (attrib) {
  //       return (
  //         getContext_old.apply(this, ["webgl2", attrib]) ||
  //         getContext_old.apply(this, ["webgl", attrib]) ||
  //         getContext_old.apply(this, ["experimental-webgl", attrib])
  //       );
  //     };
  //     _setupPainter_old.apply(this);
  //     this._canvas.getContext = getContext_old;
  //   };
  // }

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options) {
    this.id = "customLayer";
    this.type = "custom";
    this.renderingMode = "3d";
  }
  onAdd(map, gl) {
    this.map = map;
    this.coors = [
      86.753, 36.233, 0, 86.735, 33.233, 100000, 92.735, 33.233, 500000, 92.735,
      36.266, 100000, 98.753, 36.266, 500000, 98.753, 33.233, 600000, 104.753,
      33.233, 400000, 104.753, 36.266, 700000, 110.753, 36.266, 800000, 110.753,
      33.233, 400000, 116.753, 33.233, 300000, 116.753, 36.266, 100000
    ];
    //矩形平面坐标
    this.coors2 = [
      //左下角
      98.588, 27.067, 0,
      //右下角
      113.964, 27.067, 0,
      //左上角
      98.588, 36.914, 0,
      //左上角（第二个三角形）
      98.588, 36.914, 0,
      //右下角（第二个三角形）
      113.964, 27.067, 0,
      //右上角
      113.964, 36.914, 0
    ];

    const vs = `
			attribute vec3 a_pos;
      uniform mat4 u_matrix;
      void main() {
        gl_Position = u_matrix * vec4(a_pos,1.0);
      }
		`;
    const fs = `
    precision mediump float;

    uniform vec2 resolution;
    uniform float time;

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      float color = 0.0;
      // lifted from glslsandbox.com
      color += sin( uv.x * cos( time / 3.0 ) * 60.0 ) + cos( uv.y * cos( time / 2.80 ) * 10.0 );
      color += sin( uv.y * sin( time / 2.0 ) * 40.0 ) + cos( uv.x * sin( time / 1.70 ) * 40.0 );
      color += sin( uv.x * sin( time / 1.0 ) * 10.0 ) + sin( uv.y * sin( time / 3.50 ) * 80.0 );
      color *= sin( time / 10.0 ) * 0.5;

      gl_FragColor = vec4( vec3( color * 0.5, sin( color + time / 2.5 ) * 0.75, color ), 1.0 );
    }
		`;
    //创建wbgl程序直到linkprogram
    this.programInfo = createProgramInfo(gl, [vs, fs]);
    console.log("programInfo：", this.programInfo);

    //将经纬度坐标转直接转为裁剪空间坐标[0,1],也就意味着不用自己实现投影矩阵了
    //todo：弄成一个矩阵在顶点着色其中转换
    const positions = new Float32Array(this.coors2.length);

    for (let i = 0; i < this.coors2.length; i = i + 3) {
      console.log(this.coors2[i], this.coors2[i + 1]);
      const web_mkd_coor = mapboxgl.MercatorCoordinate.fromLngLat(
        {
          lng: this.coors2[i],
          lat: this.coors2[i + 1]
        },
        this.coors2[i + 2]
      );
      positions[i] = web_mkd_coor.x;
      positions[i + 1] = web_mkd_coor.y;
      positions[i + 2] = web_mkd_coor.z;
    }
    console.log(positions);

    //将数据存入缓存区
    const arrays = {
      a_pos: {
        numComponents: 3,
        data: positions
      }
    };
    this.bufferInfo = createBufferInfoFromArrays(gl, arrays);
    console.log("bufferInfo:", this.bufferInfo);
    //数据存到缓冲区了,准备阶段就完成了，
    gl.enable(gl.DEPTH_TEST);

    this.startAnimation();
  }
  //离屏渲染（帧缓冲区）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prerender(gl, matrix) {}

  render(gl, matrix) {
    let currentTime = performance.now();
    let elapsedTime = (currentTime - startTime) * 0.001; // 将时间从毫秒转换为秒

    const uniforms = {
      u_matrix: matrix,
      time: elapsedTime / 2,
      resolution: [gl.canvas.width, gl.canvas.height]
    };
    gl.useProgram(this.programInfo.program);
    setUniforms(this.programInfo, uniforms);
    setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
    // gl.drawArrays(gl.LINE_STRIP, 0, this.coors.length / 3);
    drawBufferInfo(gl, this.bufferInfo);
  }
  //资源回收
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemove(map, gl) {}

  //因为上面的render方法只是在与地图进行交互时才生效的，如果要传递一个类似于时间动画的变量就需要自己额外实现了
  startAnimation() {
    const animate = () => {
      this.map.triggerRepaint(); // 这将触发 Mapbox 的 render 方法
      requestAnimationFrame(animate);
    };
    animate();
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
