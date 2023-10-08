<!-- eslint-disable vue/multi-word-component-names -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import {onMounted, onBeforeUnmount} from "vue";
// import "@/assets/style/mapbox-gl.css";
import createREGL from "regl";
// import * as dat from "dat.gui";

import drawVert from "@/shader/wind/draw.vert.glsl?raw";
import drawFrag from "@/shader/wind/draw.frag.glsl?raw";

import quadVert from "@/shader/wind/quad.vert.glsl?raw";

import screenFrag from "@/shader/wind/screen.frag.glsl?raw";
import updateFrag from "@/shader/wind/update.frag.glsl?raw";

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

const rampColors = {
  0.0: "#3288bd",
  0.1: "#66c2a5",
  0.2: "#abdda4",
  0.3: "#e6f598",
  0.4: "#fee08b",
  0.5: "#fdae61",
  0.6: "#f46d43",
  1.0: "#d53e4f"
};

const windData = {
  source: "http://nomads.ncep.noaa.gov",
  date: "2020-04-01T00:00Z",
  width: 360,
  height: 180,
  uMin: -24.0909,
  uMax: 23.7691,
  vMin: -19.97,
  vMax: 24.3
};

const fadeOpacity = 0.996;
const speedFactor = 0.25;
const dropRate = 0.003;
const dropRateBump = 0.01;

const pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
// const gui = new dat.GUI();

let webglContext;
let regl;

const particleStateResolution = 256; //随机粒子纹理的高宽分辨率
const numParticles = particleStateResolution * particleStateResolution; //粒子数量65536

let windImage;

let windTexture;
let webglCanvas;
let colorRampTexture;
let screenTextures;
let particleStateTextures;

let framebuffer;
let quadBuffer;
let particleIndexBuffer;

onMounted(() => {
  getJSON(
    "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_coastline.geojson",
    function (data) {
      const canvas = document.getElementById("coastline");

      canvas.width = canvas.clientWidth * pxRatio;
      canvas.height = canvas.clientHeight * pxRatio;

      const ctx = canvas.getContext("2d");
      ctx.lineWidth = pxRatio;
      ctx.lineJoin = ctx.lineCap = "round";
      ctx.strokeStyle = "white";
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

  // updateWind();

  initRegl();
  initBuffer();
  windImage = new Image();
  windImage.src = "wind/2020040100.png";

  windImage.onload = function () {
    initTextures();
    regl.frame(() => {
      if (windData && windImage) {
        regl.clear({
          color: [0, 0, 0, 1],
          depth: 1
        });
        draw();
      }
    });
  };

  function checkWebGLErrors(reglInstance) {
    const gl = reglInstance._gl;
    let error = gl.getError();
    while (error !== gl.NO_ERROR) {
      console.error("WebGL Error:", error);
      error = gl.getError();
    }
  }

  // 使用方法：
  regl.poll();
  checkWebGLErrors(regl);
});

onBeforeUnmount(() => {});

const initRegl = () => {
  webglCanvas = document.getElementById("canvas");

  webglContext = webglCanvas.getContext("webgl", {antialiasing: false});

  regl = createREGL({
    gl: webglContext,
    attributes: {preserveDrawingBuffer: false}
  });

  webglContext.canvas.width = webglContext.canvas.clientWidth;
  webglContext.canvas.height = webglContext.canvas.clientHeight;
};

const initTextures = () => {
  /**
   * 风场数据纹理
   */
  // console.log(windImage.src);
  // windImage.onload = function () {
  windTexture = regl.texture({
    data: windImage,
    mag: "linear",
    min: "linear"
  });
  // };

  /**
   * 颜色渐变纹理，用于给片段着色器根据风速来拾取改纹理的中不同颜色
   */
  colorRampTexture = regl.texture({
    data: getColorRamp(rampColors),
    width: 16,
    height: 16,
    mag: "linear",
    min: "linear"
  });

  screenTextures = initScreenTextures();
  particleStateTextures = initParticleStateTextures();
};

const initBuffer = () => {
  framebuffer = regl.framebuffer({
    depthStencil: false,
    colorCount: 1,
    colorFormat: "rgba",
    colorType: "uint8"
  });

  quadBuffer = regl.buffer(
    new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
  );

  particleIndexBuffer = initParticleIndexBuffer();
};

const draw = () => {
  drawScreen();
  updateParticles();
};

const drawCommand = () => {
  return regl({
    primitive: "points",

    count: numParticles,

    viewport: {
      width: webglContext.canvas.width,
      height: webglContext.canvas.height
    },

    depth: {
      enable: false
    },
    stencil: {
      enable: false
    },

    vert: drawVert,
    frag: drawFrag,

    attributes: {
      a_index: regl.prop("particleIndexBuffer")
    },

    uniforms: {
      u_wind: regl.prop("windTexture"),
      u_particles: regl.prop("particleStateTexture"),
      u_color_ramp: regl.prop("colorRampTexture"),

      u_particles_res: regl.prop("particleStateResolution"),
      u_wind_min: regl.prop("windMin"),
      u_wind_max: regl.prop("windMax")
    }
  });
};

const screenCommand = () => {
  return regl({
    primitive: "triangles",
    count: 6,

    viewport: {
      width: webglContext.canvas.width,
      height: webglContext.canvas.height
    },

    depth: {
      enable: false
    },
    stencil: {
      enable: false
    },

    vert: quadVert,
    frag: screenFrag,

    blend: {
      enable: regl.prop("blend"),
      func: {
        srcRGB: "src alpha",
        srcAlpha: 1,
        dstRGB: "one minus src alpha",
        dstAlpha: 1
      }
    },

    attributes: {
      a_pos: regl.prop("quadBuffer")
    },

    uniforms: {
      u_opacity: regl.prop("opacity"),
      u_screen: regl.prop("texture")
    }
  });
};

const updateCommand = () => {
  return regl({
    primitive: "triangles",
    count: 6,

    viewport: {
      width: particleStateResolution,
      height: particleStateResolution
    },

    depth: {
      enable: false
    },
    stencil: {
      enable: false
    },

    vert: quadVert,
    frag: updateFrag,

    attributes: {
      a_pos: regl.prop("quadBuffer")
    },

    uniforms: {
      u_wind: regl.prop("windTexture"),
      u_particles: regl.prop("particleStateTexture"),

      u_rand_seed: () => Math.random(),
      u_wind_res: regl.prop("windRes"),
      u_wind_min: regl.prop("windMin"),
      u_wind_max: regl.prop("windMax"),
      u_speed_factor: regl.prop("speedFactor"),
      u_drop_rate: regl.prop("dropRate"),
      u_drop_rate_bump: regl.prop("dropRateBump")
    }
  });
};

/**
 * 创建两个空的屏幕纹理
 * 一个是背景纹，用于保存前一帧，一个是屏幕纹理用于保存当前帧的绘制
 * 一个像素有四个Uint8Array
 */
const initScreenTextures = () => {
  const {canvas} = webglContext;
  const emptyPixels = new Uint8Array(canvas.width * canvas.height * 4);

  return [
    regl.texture({
      data: emptyPixels,
      mag: "nearest",
      min: "nearest",
      width: canvas.width,
      height: canvas.height
    }),
    regl.texture({
      data: emptyPixels,
      mag: "nearest",
      min: "nearest",
      width: canvas.width,
      height: canvas.height
    })
  ];
};

/**
 * 创建两个粒子状态纹理：根据粒子的数量构建一个空的纹理
 * 这两个纹理将在动画更新过程中交替使用，一个用于读取当前状态，另一个用于写入新状态
 */
const initParticleStateTextures = () => {
  // const gl = webglContext;

  //初始化粒子状态：创建一个 Uint8Array 来存储粒子的状态。每个粒子的状态由 4 个字节（RGBA）表示。
  const particleState = new Uint8Array(numParticles * 4)
    .fill(null)
    .map(() => Math.floor(Math.random() * 256));

  return [
    regl.texture({
      data: particleState,
      width: particleStateResolution,
      height: particleStateResolution,
      mag: "nearest",
      min: "nearest"
    }),
    regl.texture({
      data: particleState,
      width: particleStateResolution,
      height: particleStateResolution,
      mag: "nearest",
      min: "nearest"
    })
  ];
};

/**
 * 创建粒子索引缓冲区，使用这些索引，我们创建一个 WebGL 缓冲区 particleIndexBuffer。
 * 这个缓冲区将在绘制粒子时使用，确保每个粒子都有一个唯一的索引。
 */
const initParticleIndexBuffer = () => {
  const particleIndices = new Float32Array(numParticles);
  for (let i = 0; i < numParticles; i++) {
    particleIndices[i] = i;
  }
  return regl.buffer(particleIndices);
};

/**
 * 这段代码的目的是根据提供的颜色数据创建一个水平的颜色渐变纹理。这个纹理可以用于根据粒子的速度为粒子上色，
 * 例如，速度较慢的粒子可能会被着色为蓝色，而速度较快的粒子可能会被着色为红色。
 * @param {*} colors 渐变颜色对象
 * @returns canvas 上的像素数据，并将其转换为 Uint8Array
 */
const getColorRamp = colors => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 256;
  canvas.height = 1;

  //创建一个水平的线性渐变
  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  for (const stop in colors) {
    gradient.addColorStop(+stop, colors[stop]);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);

  return new Uint8Array(ctx.getImageData(0, 0, 256, 1).data);
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

const updateWind = name => {
  getJSON("wind/2020040100.json", function (windData) {
    console.log(windData);
    // const windImage = new Image();

    // windData.image = windImage;
    // windImage.src = "wind/" + windFiles[name] + ".png";
    // windImage.onload = function () {

    // };
  });
};

const drawScreen = () => {
  const backgroundTexture = screenTextures[0];
  const screenTexture = screenTextures[1];

  // draw the screen into a temporary framebuffer to retain it as the background on the next frame
  framebuffer({color: screenTexture});

  framebuffer.use(function () {
    drawTexture(backgroundTexture, {opacity: fadeOpacity});
    drawParticles();
  });

  // enable blending to support drawing on top of an existing background (e.g. a map)
  drawTexture(screenTexture, {blend: true});

  // save the current screen as the background for the next frame
  const temp = backgroundTexture;
  screenTextures[0] = screenTexture;
  screenTextures[1] = temp;
};

const drawTexture = (texture, opts = {}) => {
  screenCommand({
    texture,
    blend: false,
    quadBuffer,
    opacity: 1.0,
    ...opts
  });
};

const drawParticles = () => {
  drawCommand({
    particleStateResolution,
    windMin: [windData.uMin, windData.vMin],
    windMax: [windData.uMax, windData.vMax],
    colorRampTexture,
    particleStateTexture: particleStateTextures[0],
    windTexture,
    particleIndexBuffer
  });
};

const updateParticles = () => {
  framebuffer({color: particleStateTextures[1]});

  framebuffer.use(function () {
    updateCommand({
      quadBuffer,
      windTexture,
      particleStateTexture: particleStateTextures[0],
      windRes: [windData.width, windData.height],
      windMin: [windData.uMin, windData.vMin],
      windMax: [windData.uMax, windData.vMax],
      speedFactor: parseFloat(speedFactor),
      dropRate: parseFloat(dropRate),
      dropRateBump: parseFloat(dropRateBump)
    });
  });

  // swap the particle state textures so the new one becomes the current one
  const temp = particleStateTextures[0];
  particleStateTextures[0] = particleStateTextures[1];
  particleStateTextures[1] = temp;
};
</script>

<template>
  <canvas id="canvas"></canvas>
  <canvas id="coastline"></canvas>
</template>

<style scoped lang="scss">
#coastline {
  background: black;
}
#canvas,
#coastline {
  display: block;
  width: 90.22vw;
  height: 100vh;
  position: absolute;
}
</style>
