<template>
  <canvas id="gl"></canvas>
</template>
<script setup lang="ts">
import GUI from "lil-gui";
import {
  AxesHelper,
  ShaderMaterial,
  BufferGeometry,
  BufferAttribute,
  Clock,
  AdditiveBlending,
  PerspectiveCamera,
  Scene,
  Points,
  WebGLRenderer,
  Color
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import * as animations from "@/utils/threeUtils/animations";
import {resizeRendererToDisplaySize} from "@/utils/threeUtils/responsiveness";
import {onMounted, onUnmounted} from "vue";
import galaxyVertexShader from "@/shader/galaxy/vertex.glsl?raw";
import galaxyFragmentShader from "@/shader/galaxy/fragment.glsl?raw";

const animation = {enabled: false, play: true};

let canvas: HTMLCanvasElement;
let renderer: WebGLRenderer;
let scene: Scene;
let camera: PerspectiveCamera;
let cameraControls: OrbitControls;
let axesHelper: AxesHelper;
let clock: Clock;
let stats: Stats;
let gui: GUI;
let particles: Points = null;

//星系生成参数
const parameters = {
  count: 200000,
  size: 0.005,
  radius: 5,
  spin: 1,
  branches: 3, //分支数
  randomness: 0.2,
  randomnessPower: 3,
  insideColor: "#cc8b66",
  outsideColor: "#0d38e3"
};

let geometry = null;
let material = null;

onMounted(() => {
  init();
  animate();
});

onUnmounted(() => {
  destroy();
  if (stats.dom && stats.dom.parentElement) {
    stats.dom.parentElement.removeChild(stats.dom);
  }
});

const init = () => {
  // renderer&&scene
  {
    canvas = document.querySelector("#gl");
    renderer = new WebGLRenderer({
      canvas: canvas
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene = new Scene();
  }

  // // light
  // {
  //   ambientLight = new AmbientLight("white", 0.4);
  //   pointLight = new PointLight("#ffdca8", 1.2, 100);
  //   pointLight.position.set(-2, 3, 3);
  //   pointLight.castShadow = true;
  //   pointLight.shadow.radius = 4;
  //   pointLight.shadow.camera.near = 0.5;
  //   pointLight.shadow.camera.far = 4000;
  //   pointLight.shadow.mapSize.width = 2048;
  //   pointLight.shadow.mapSize.height = 2048;
  //   scene.add(ambientLight);
  //   scene.add(pointLight);
  // }

  //object
  generateGalaxy();

  // camera
  {
    camera = new PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(3, 3, 3);
  }

  // controls
  {
    cameraControls = new OrbitControls(camera, canvas);
    cameraControls.target = particles.position.clone();
    cameraControls.enableDamping = true;
    cameraControls.update();
  }

  // helpers
  {
    axesHelper = new AxesHelper(4);
    axesHelper.visible = false;
    scene.add(axesHelper);
  }

  // STATS & CLOCK
  {
    clock = new Clock();
    stats = new Stats();
    stats.dom.style.left = "200px";
    canvas.parentNode.appendChild(stats.dom);
  }

  // DEBUG GUI
  {
    gui = new GUI({title: "🐞 Debug GUI", width: 250});

    gui
      .add(parameters, "count")
      .min(100)
      .max(1000000)
      .step(100)
      .onFinishChange(generateGalaxy);
    gui
      .add(parameters, "radius")
      .min(0.01)
      .max(20)
      .step(0.01)
      .onFinishChange(generateGalaxy);
    gui
      .add(parameters, "branches")
      .min(2)
      .max(20)
      .step(1)
      .onFinishChange(generateGalaxy);
    gui
      .add(parameters, "randomness")
      .min(0)
      .max(2)
      .step(0.001)
      .onFinishChange(generateGalaxy);
    gui
      .add(parameters, "randomnessPower")
      .min(1)
      .max(10)
      .step(0.001)
      .onFinishChange(generateGalaxy);
    gui.addColor(parameters, "insideColor").onFinishChange(generateGalaxy);
    gui.addColor(parameters, "outsideColor").onFinishChange(generateGalaxy);

    const helpersFolder = gui.addFolder("Helpers");
    helpersFolder.add(axesHelper, "visible").name("axes");
  }
};

const animate = () => {
  requestAnimationFrame(animate);
  stats.update();
  if (animation.enabled && animation.play) {
    animations.rotate(particles, clock, Math.PI / 3);
    animations.bounce(particles, clock, 1, 0.5, 0.5);
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  const elapsedTime = clock.getElapsedTime();

  // Update material
  material.uniforms.uTime.value = elapsedTime;

  cameraControls.update();
  renderer.render(scene, camera);
};

const generateGalaxy = () => {
  if (particles !== null) {
    geometry.dispose();
    material.dispose();
    scene.remove(particles);
  }
  //geometry
  geometry = new BufferGeometry();
  const positions = new Float32Array(parameters.count * 3);
  const randomness = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);
  const scales = new Float32Array(parameters.count * 1);

  const insideColor = new Color(parameters.insideColor);
  const outsideColor = new Color(parameters.outsideColor);

  //我们将顶点放置在从中心到半径的直线上，
  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;

    // Position
    const radius = Math.random() * parameters.radius;

    const branchAngle =
      ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

    const randomX =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomY =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomZ =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;

    positions[i3] = Math.cos(branchAngle) * radius;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = Math.sin(branchAngle) * radius;

    randomness[i3] = randomX;
    randomness[i3 + 1] = randomY;
    randomness[i3 + 2] = randomZ;

    // Color
    const mixedColor = insideColor.clone();
    mixedColor.lerp(outsideColor, radius / parameters.radius);

    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;

    // Scale
    scales[i] = Math.random();
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aRandomness", new BufferAttribute(randomness, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("aScale", new BufferAttribute(scales, 1));

  // material
  /**
   * Material
   */
  material = new ShaderMaterial({
    depthWrite: false,
    blending: AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uTime: {value: 0},
      uSize: {value: 30 * renderer.getPixelRatio()}
    },
    vertexShader: galaxyVertexShader,
    fragmentShader: galaxyFragmentShader
  });

  particles = new Points(geometry, material);
  scene.add(particles);
};

const destroy = () => {
  if (gui) gui.destroy();
};
</script>
<style>
#gl {
  width: 90.23vw;
  height: 100vh;
  display: block;
  background: rgb(0, 0, 0);
}

.lil-gui.root > .children > .lil-gui > .title {
  color: white;
  padding-right: 180px;
}
</style>
