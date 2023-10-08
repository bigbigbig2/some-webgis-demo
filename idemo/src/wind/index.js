import * as util from "@/utils/webglUtils/util.js";

import drawVert from "@/shader/wind/draw.vert.glsl?raw";
import drawFrag from "@/shader/wind/draw.frag.glsl?raw";

import quadVert from "@/shader/wind/quad.vert.glsl?raw";

import screenFrag from "@/shader/wind/screen.frag.glsl?raw";
import updateFrag from "@/shader/wind/update.frag.glsl?raw";

// const defaultRampColors = {
//   0.0: "#3288bd",
//   0.1: "#66c2a5",
//   0.2: "#abdda4",
//   0.3: "#e6f598",
//   0.4: "#fee08b",
//   0.5: "#fdae61",
//   0.6: "#f46d43",
//   1.0: "#d53e4f"
// };
const blueRampColors = {
  0.0: "#003366", // Dark Blue
  0.1: "#004699", // Navy Blue
  0.2: "#0055cc", // Royal Blue
  0.3: "#0066ff", // Bright Blue
  0.4: "#3399ff", // Sky Blue
  0.5: "#66ccff", // Light Sky Blue
  0.6: "#99ccff", // Very Light Sky Blue
  1.0: "#cce7ff" // Almost White with a Blue Tint
};

export default class WindGL {
  constructor(gl) {
    this.gl = gl;

    this.fadeOpacity = 0.996; //每帧粒子消失的速度
    this.speedFactor = 0.25; // 粒子移动的速度
    this.dropRate = 0.003; // 粒子移动到随机位置的频率
    this.dropRateBump = 0.01; // 相对于单个粒子速度的下降率增加

    //这个程序的目的是绘制风场中的粒子，并根据粒子的速度为它们上色。
    this.drawProgram = util.createProgram(gl, drawVert, drawFrag);
    //将一个纹理（例如前一帧的屏幕内容）绘制到屏幕上，并允许调整其不透明度。
    this.screenProgram = util.createProgram(gl, quadVert, screenFrag);
    this.updateProgram = util.createProgram(gl, quadVert, updateFrag);

    this.quadBuffer = util.createBuffer(
      gl,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    ); //矩形六个点
    this.framebuffer = gl.createFramebuffer();

    this.setColorRamp(blueRampColors);
    this.resize();
  }

  resize() {
    const gl = this.gl;
    //一个新的、与 canvas 尺寸相匹配的空像素数组。这个数组将用于初始化新的纹理。
    const emptyPixels = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
    // 屏幕纹理用于保存前一帧和当前帧的绘制屏幕
    this.backgroundTexture = util.createTexture(
      gl,
      gl.NEAREST,
      emptyPixels,
      gl.canvas.width,
      gl.canvas.height
    );
    this.screenTexture = util.createTexture(
      gl,
      gl.NEAREST,
      emptyPixels,
      gl.canvas.width,
      gl.canvas.height
    );
  }

  setColorRamp(colors) {
    // 创建一个渐变纹理，用于给速度着色
    this.colorRampTexture = util.createTexture(
      this.gl,
      this.gl.LINEAR,
      getColorRamp(colors),
      16,
      16
    );
  }

  set numParticles(numParticles) {
    const gl = this.gl;

    // 纹理分辨率的计算，希望创建一个正方形的纹理，其中每个像素代表一个粒子的状态。为了确定纹理的分辨率，
    //我们首先计算所需粒子数的平方根，然后向上取整。这确保了纹理的宽度和高度足够容纳所有粒子。
    const particleRes = (this.particleStateResolution = Math.ceil(
      Math.sqrt(numParticles)
    ));
    this._numParticles = particleRes * particleRes;

    //初始化粒子状态：创建一个 Uint8Array 来存储粒子的状态。每个粒子的状态由 4 个字节（RGBA）表示。
    const particleState = new Uint8Array(this._numParticles * 4);

    //创建纹理
    for (let i = 0; i < particleState.length; i++) {
      particleState[i] = Math.floor(Math.random() * 256); // 随机化初始粒子位置
    }

    //使用上面的 particleState 数据，我们创建两个纹理：particleStateTexture0 和 particleStateTexture1。
    //这两个纹理将在动画更新过程中交替使用，一个用于读取当前状态，另一个用于写入新状态。
    this.particleStateTexture0 = util.createTexture(
      gl,
      gl.NEAREST,
      particleState, //将随机创建的粒子作为纹理传递
      particleRes,
      particleRes
    );
    this.particleStateTexture1 = util.createTexture(
      gl,
      gl.NEAREST,
      particleState,
      particleRes,
      particleRes
    );

    //创建粒子索引缓冲区，使用这些索引，我们创建一个 WebGL 缓冲区 particleIndexBuffer。
    //这个缓冲区将在绘制粒子时使用，确保每个粒子都有一个唯一的索引。
    const particleIndices = new Float32Array(this._numParticles);
    for (let i = 0; i < this._numParticles; i++) particleIndices[i] = i;
    this.particleIndexBuffer = util.createBuffer(gl, particleIndices);
  }
  get numParticles() {
    return this._numParticles;
  }

  setWind(windData) {
    this.windData = windData;
    this.windTexture = util.createTexture(
      this.gl,
      this.gl.LINEAR,
      windData.image
    );
  }

  draw() {
    const gl = this.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);

    util.bindTexture(gl, this.windTexture, 0); //风场图片纹理
    util.bindTexture(gl, this.particleStateTexture0, 1); //粒子状态纹理

    this.drawScreen();
    this.updateParticles();
  }

  drawScreen() {
    const gl = this.gl;
    //将绘制操作绑定到一个帧缓冲区，这样，你可以先在帧缓冲区中进行一些操作，然后再将其内容绘制到屏幕上
    util.bindFramebuffer(gl, this.framebuffer, this.screenTexture);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    ////使用纹理绘制了一个空的背景
    this.drawTexture(this.backgroundTexture, this.fadeOpacity);
    this.drawParticles();

    util.bindFramebuffer(gl, null);
    // enable blending to support drawing on top of an existing background (e.g. a map)
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.drawTexture(this.screenTexture, 1.0);
    gl.disable(gl.BLEND);

    // save the current screen as the background for the next frame
    const temp = this.backgroundTexture;
    this.backgroundTexture = this.screenTexture;
    this.screenTexture = temp;
  }

  drawTexture(texture, opacity) {
    const gl = this.gl;
    const program = this.screenProgram;
    gl.useProgram(program.program);

    util.bindAttribute(gl, this.quadBuffer, program.a_pos, 2);
    util.bindTexture(gl, texture, 2);
    gl.uniform1i(program.u_screen, 2); //传递屏幕纹理
    gl.uniform1f(program.u_opacity, opacity); //传递透明度

    gl.drawArrays(gl.TRIANGLES, 0, 6); //绘制纹理到帧缓冲区
  }

  drawParticles() {
    const gl = this.gl;
    const program = this.drawProgram;
    gl.useProgram(program.program);

    util.bindAttribute(gl, this.particleIndexBuffer, program.a_index, 1);
    util.bindTexture(gl, this.colorRampTexture, 2);

    gl.uniform1i(program.u_wind, 0);
    gl.uniform1i(program.u_particles, 1);
    gl.uniform1i(program.u_color_ramp, 2);

    gl.uniform1f(program.u_particles_res, this.particleStateResolution);
    gl.uniform2f(program.u_wind_min, this.windData.uMin, this.windData.vMin);
    gl.uniform2f(program.u_wind_max, this.windData.uMax, this.windData.vMax);

    gl.drawArrays(gl.POINTS, 0, this._numParticles);
  }

  updateParticles() {
    const gl = this.gl;
    util.bindFramebuffer(gl, this.framebuffer, this.particleStateTexture1);
    gl.viewport(
      0,
      0,
      this.particleStateResolution,
      this.particleStateResolution
    );

    const program = this.updateProgram;
    gl.useProgram(program.program);

    util.bindAttribute(gl, this.quadBuffer, program.a_pos, 2);

    gl.uniform1i(program.u_wind, 0);
    gl.uniform1i(program.u_particles, 1);

    gl.uniform1f(program.u_rand_seed, Math.random());
    gl.uniform2f(program.u_wind_res, this.windData.width, this.windData.height);
    gl.uniform2f(program.u_wind_min, this.windData.uMin, this.windData.vMin);
    gl.uniform2f(program.u_wind_max, this.windData.uMax, this.windData.vMax);
    gl.uniform1f(program.u_speed_factor, this.speedFactor);
    gl.uniform1f(program.u_drop_rate, this.dropRate);
    gl.uniform1f(program.u_drop_rate_bump, this.dropRateBump);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // swap the particle state textures so the new one becomes the current one
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
