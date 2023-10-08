<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import {onMounted, onBeforeUnmount} from "vue";
import WindGL from "@/wind/index";
import * as dat from "dat.gui";

const pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
const gui = new dat.GUI();
let canvas;
let gl;
let wind;

const meta = {
  "2016-11-20+h": 0,
  "retina resolution": true,
  "github.com/mapbox/webgl-wind": function () {
    window.location = "https://github.com/mapbox/webgl-wind";
  }
};

onMounted(() => {
  initWebgl();
  frame();
  initDatGUI();
  //绘制底部线条
  getJSON(
    "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_coastline.geojson",
    function (data) {
      const canvas = document.getElementById("coastline");

      canvas.width = canvas.clientWidth * pxRatio;
      canvas.height = canvas.clientHeight * pxRatio;

      const ctx = canvas.getContext("2d");
      ctx.lineWidth = pxRatio;
      ctx.lineJoin = ctx.lineCap = "round";
      ctx.strokeStyle = "black";
      ctx.beginPath();

      for (let i = 0; i < data.features.length; i++) {
        const line = data.features[i].geometry.coordinates;
        for (let j = 0; j < line.length; j++) {
          ctx[j ? "lineTo" : "moveTo"](
            ((line[j][0] + 180) * canvas.width) / 360,
            ((-line[j][1] + 90) * canvas.height) / 180
          );
        }
      }
      ctx.stroke();
    }
  );
  updateWind(0);
  updateRetina();
});

const initWebgl = () => {
  canvas = document.getElementById("canvas");

  Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  gl = canvas.getContext("webgl", {antialiasing: false});

  wind = window.wind = new WindGL(gl);
  wind.numParticles = 65536; //粒子数量
};

const frame = () => {
  if (wind.windData) {
    wind.draw();
  }
  requestAnimationFrame(frame);
};

const initDatGUI = () => {
  gui.add(wind, "numParticles", 1024, 589824);
  gui.add(wind, "fadeOpacity", 0.96, 0.999).step(0.001).updateDisplay();
  gui.add(wind, "speedFactor", 0.05, 1.0);
  gui.add(wind, "dropRate", 0, 0.1);
  gui.add(wind, "dropRateBump", 0, 0.2);

  gui.add(meta, "2016-11-20+h", 0, 48, 6).onFinishChange(updateWind);
  if (pxRatio !== 1) {
    gui.add(meta, "retina resolution").onFinishChange(updateRetina);
  }
};

const windFiles = {
  0: "2016112000",
  6: "2016112006",
  12: "2016112012",
  18: "2016112018",
  24: "2016112100",
  30: "2016112106",
  36: "2016112112",
  42: "2016112118",
  48: "2016112200"
};
const getJSON = (url, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.responseType = "json";
  xhr.open("get", url, true);
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      callback(xhr.response);
    } else {
      throw new Error(xhr.statusText);
    }
  };
  xhr.send();
};

/**
 * 根据是否启用retina resolution来设定设备的像素比率，当用户切换 "retina resolution" 选项或当窗口尺寸发生变化时，这些函数会被调用。
 */
const updateRetina = () => {
  const ratio = meta["retina resolution"] ? pxRatio : 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  wind.resize();
};

const updateWind = name => {
  getJSON("wind/" + windFiles[name] + ".json", function (windData) {
    const windImage = new Image();

    windData.image = windImage;
    windImage.src = "wind/" + windFiles[name] + ".png";
    windImage.onload = function () {
      wind.setWind(windData);
    };
  });
};

onBeforeUnmount(() => {
  gui.destroy();
});
</script>

<template>
  <canvas id="coastline"></canvas>
  <canvas id="canvas"></canvas>
</template>

<style scoped>
#coastline {
  background: rgb(241, 241, 241);
}
#canvas,
#coastline {
  display: block;
  width: 90.22vw;
  height: 100vh;
  position: absolute;
}
</style>
