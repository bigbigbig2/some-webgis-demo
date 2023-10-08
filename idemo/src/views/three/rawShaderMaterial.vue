<template>
  <canvas id="gl"></canvas>
</template>
<script setup>
import GUI from "lil-gui";
import {
  PlaneGeometry,
  AxesHelper,
  Clock,
  Mesh,
  Vector2,
  RawShaderMaterial,
  PerspectiveCamera,
  DoubleSide,
  Scene,
  WebGLRenderer,
  BufferAttribute
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import {resizeRendererToDisplaySize} from "@/utils/threeUtils/responsiveness";
import {onMounted, onUnmounted} from "vue";
import testFragmentShader from "@/shader/rawShaderMaterial/fragment.glsl?raw";
import testVertexShader from "@/shader/rawShaderMaterial/vertex.glsl?raw";

let canvas;
let renderer;
let scene;
let camera;
let cameraControls;
let axesHelper;
let clock;
let stats;
let gui;
let geometry;
let material;

onMounted(() => {
  // document.getElementById('my-three')?.appendChild(renderer.domElement)
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
    renderer = new WebGLRenderer({canvas, antialias: true, alpha: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene = new Scene();
  }

  // light

  //object
  {
    // Geometry
    geometry = new PlaneGeometry(1, 1, 32, 32);

    // Material
    material = new RawShaderMaterial({
      vertexShader: testVertexShader,
      fragmentShader: testFragmentShader,
      side: DoubleSide, // Add this line
      uniforms: {
        uFrequency: {value: new Vector2(10, 5)}, //传递一个波动频率
        uTime: {value: 0}
      }
    });

    const count = geometry.attributes.position.count; //获取几何体的顶点数
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      randoms[i] = Math.random();
    }

    geometry.setAttribute("aRandom", new BufferAttribute(randoms, 1)); //传递attribute

    // Mesh
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);
  }

  // camera
  {
    camera = new PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0.25, -0.25, 1);
    scene.add(camera);
  }

  // controls
  {
    cameraControls = new OrbitControls(camera, canvas);
    cameraControls.enableDamping = true;
    cameraControls.autoRotate = false;
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

    const helpersFolder = gui.addFolder("Helpers");
    helpersFolder.add(axesHelper, "visible").name("axes");

    const cameraFolder = gui.addFolder("Camera");
    cameraFolder.add(cameraControls, "autoRotate");

    // reset GUI state button
    const resetGui = () => {
      gui.reset();
    };
    gui.add({resetGui}, "resetGui").name("RESET");
  }
};

const animate = () => {
  requestAnimationFrame(animate);
  stats.update();
  // Update particles
  const elapsedTime = clock.getElapsedTime();
  material.uniforms.uTime.value = elapsedTime;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  cameraControls.update();
  renderer.render(scene, camera);
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
  background: rgb(32, 32, 32);
}

.lil-gui.root > .children > .lil-gui > .title {
  color: white;
  padding-right: 180px;
}
</style>
