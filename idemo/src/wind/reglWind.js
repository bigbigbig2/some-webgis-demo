import createREGL from "regl";
import drawVert from "@/shader/wind/draw.vert.glsl?raw";
import drawFrag from "@/shader/wind/draw.frag.glsl?raw";

import quadVert from "@/shader/wind/quad.vert.glsl?raw";

import screenFrag from "@/shader/wind/screen.frag.glsl?raw";
import updateFrag from "@/shader/wind/update.frag.glsl?raw";

const defaultRampColors = {
  0.0: "#3288bd",
  0.1: "#66c2a5",
  0.2: "#abdda4",
  0.3: "#e6f598",
  0.4: "#fee08b",
  0.5: "#fdae61",
  0.6: "#f46d43",
  1.0: "#d53e4f"
};

export default class WindGL {
  constructor(webglContext) {
    this.regl = createREGL({
      gl: webglContext,
      attributes: {preserveDrawingBuffer: false}
    });

    this.fadeOpacity = 0.996;
    this.speedFactor = 0.25;
    this.dropRate = 0.003;
    this.dropRateBump = 0.01;

    this.setColorRamp(defaultRampColors);
    this.resize();

    this.quadBuffer = this.regl.buffer([
      [0, 0],
      [1, 0],
      [0, 1],
      [0, 1],
      [1, 0],
      [1, 1]
    ]);

    this.drawParticlesCommand = this.regl({
      frag: drawFrag,
      vert: drawVert,
      attributes: {
        a_index: this.regl.buffer({data: [], usage: "dynamic"})
      },
      uniforms: {
        u_wind: this.regl.texture(),
        u_particles: this.regl.texture(),
        u_color_ramp: this.regl.texture(),
        u_particles_res: this.regl.prop("particleStateResolution"),
        u_wind_min: this.regl.prop("windMin"),
        u_wind_max: this.regl.prop("windMax")
      },
      count: this._numParticles,
      primitive: "points"
    });

    this.updateParticlesCommand = this.regl({
      frag: updateFrag,
      vert: quadVert,
      attributes: {
        a_pos: this.quadBuffer
      },
      uniforms: {
        u_wind: this.regl.texture(),
        u_particles: this.regl.texture(),
        u_rand_seed: this.regl.context("tick"),
        u_wind_res: this.regl.prop("windRes"),
        u_wind_min: this.regl.prop("windMin"),
        u_wind_max: this.regl.prop("windMax"),
        u_speed_factor: this.speedFactor,
        u_drop_rate: this.dropRate,
        u_drop_rate_bump: this.dropRateBump
      },
      framebuffer: this.regl.framebuffer({
        color: this.regl.texture({
          width: 1,
          height: 1,
          wrap: "clamp"
        })
      }),
      count: 6
    });
  }

  resize() {
    const width = this.regl._gl.canvas.width;
    const height = this.regl._gl.canvas.height;
    const emptyPixels = new Uint8Array(width * height * 4);
    this.backgroundTexture = this.regl.texture({
      data: emptyPixels,
      width: width,
      height: height,
      wrap: "clamp"
    });
    this.screenTexture = this.regl.texture({
      data: emptyPixels,
      width: width,
      height: height,
      wrap: "clamp"
    });
  }

  setColorRamp(colors) {
    this.colorRampTexture = this.regl.texture({
      data: getColorRamp(colors),
      width: 16,
      height: 16,
      wrap: "clamp"
    });
  }

  set numParticles(numParticles) {
    const particleRes = (this.particleStateResolution = Math.ceil(
      Math.sqrt(numParticles)
    ));
    this._numParticles = particleRes * particleRes;

    const particleState = new Uint8Array(this._numParticles * 4);
    for (let i = 0; i < particleState.length; i++) {
      particleState[i] = Math.floor(Math.random() * 256);
    }

    this.particleStateTexture0 = this.regl.texture({
      data: particleState,
      width: particleRes,
      height: particleRes,
      wrap: "clamp"
    });
    this.particleStateTexture1 = this.regl.texture({
      data: particleState,
      width: particleRes,
      height: particleRes,
      wrap: "clamp"
    });

    const particleIndices = new Float32Array(this._numParticles);
    for (let i = 0; i < this._numParticles; i++) particleIndices[i] = i;
    this.particleIndexBuffer = this.regl.buffer(particleIndices);
  }

  get numParticles() {
    return this._numParticles;
  }

  setWind(windData) {
    this.windData = windData;
    this.windTexture = this.regl.texture(windData.image);
  }

  draw() {
    this.regl.clear({color: [0, 0, 0, 0], depth: 1});

    this.drawParticlesCommand({
      particleStateResolution: this.particleStateResolution, // 添加这一行
      windMin: [this.windData.uMin, this.windData.vMin],
      windMax: [this.windData.uMax, this.windData.vMax]
    });

    this.updateParticlesCommand({
      windRes: [this.windData.width, this.windData.height],
      windMin: [this.windData.uMin, this.windData.vMin],
      windMax: [this.windData.uMax, this.windData.vMax]
    });
  }

  drawScreen() {
    const drawBackground = this.regl({
      frag: screenFrag,
      vert: quadVert,
      attributes: {
        a_pos: this.quadBuffer
      },
      uniforms: {
        u_screen: this.regl.texture(this.backgroundTexture),
        u_opacity: this.fadeOpacity
      },
      framebuffer: this.screenTexture,
      count: 6
    });

    const drawToScreen = this.regl({
      frag: screenFrag,
      vert: quadVert,
      attributes: {
        a_pos: this.quadBuffer
      },
      uniforms: {
        u_screen: this.regl.texture(this.screenTexture),
        u_opacity: 1.0
      },
      count: 6
    });

    drawBackground();
    this.drawParticles();
    drawToScreen();

    // Swap textures
    const temp = this.backgroundTexture;
    this.backgroundTexture = this.screenTexture;
    this.screenTexture = temp;
  }

  drawParticles() {
    console.log(this.particleStateResolution);
    this.drawParticlesCommand({
      particleStateResolution: this.particleStateResolution,
      windMin: [this.windData.uMin, this.windData.vMin],
      windMax: [this.windData.uMax, this.windData.vMax]
    });
  }

  updateParticles() {
    this.updateParticlesCommand({
      particleStateResolution: this.particleStateResolution, // 添加这一行
      windRes: [this.windData.width, this.windData.height],
      windMin: [this.windData.uMin, this.windData.vMin],
      windMax: [this.windData.uMax, this.windData.vMax]
    });

    // Swap particle state textures
    const temp = this.particleStateTexture0;
    this.particleStateTexture0 = this.particleStateTexture1;
    this.particleStateTexture1 = temp;
  }
}

/**
 * 这段代码的目的是根据提供的颜色数据创建一个水平的颜色渐变纹理。这个纹理可以用于根据粒子的速度为粒子上色，
 * 例如，速度较慢的粒子可能会被着色为蓝色，而速度较快的粒子可能会被着色为红色。
 * @param {*} colors 渐变颜色对象
 * @returns canvas 上的像素数据，并将其转换为 Uint8Array
 */
function getColorRamp(colors) {
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
}
