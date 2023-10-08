<template>
  <canvas id="gl"></canvas>
</template>
<script setup lang="ts">
import GUI from "lil-gui";
import {
  AmbientLight,
  AxesHelper,
  PointsMaterial,
  Clock,
  TextureLoader,
  Points,
  PerspectiveCamera,
  PointLight,
  Scene,
  WebGLRenderer,
  BufferAttribute,
  BufferGeometry
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import * as animations from "@/utils/threeUtils/animations";
import {resizeRendererToDisplaySize} from "@/utils/threeUtils/responsiveness";
import {onMounted, onUnmounted} from "vue";

const animation = {enabled: false, play: true};

let canvas: HTMLCanvasElement;
let renderer: WebGLRenderer;
let scene: Scene;
let ambientLight: AmbientLight;
let pointLight: PointLight;
let camera: PerspectiveCamera;
let cameraControls: OrbitControls;
let axesHelper: AxesHelper;
let clock: Clock;
let stats: Stats;
let gui: GUI;
let particles: Points;

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
  {
    ambientLight = new AmbientLight("white", 0.4);
    pointLight = new PointLight("#ffdca8", 1.2, 100);
    pointLight.position.set(-2, 3, 3);
    pointLight.castShadow = true;
    pointLight.shadow.radius = 4;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 4000;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    scene.add(ambientLight);
    scene.add(pointLight);
  }

  //object
  {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const particlesGeometry = new BufferGeometry(1, 32, 32);
    const count = 5000;
    // 每一个vertex有三个points
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      // x,y,z 属于[-5, 5]区间
      positions[i] = (Math.random() - 0.5) * 10;
    }
    particlesGeometry.setAttribute(
      "position",
      new BufferAttribute(positions, 3)
    );
    const particlesMaterial = new PointsMaterial({
      size: 0.04,
      sizeAttenuation: true
    });
    const textureLoader = new TextureLoader();
    const particleTexture = textureLoader.load("/particles/star_04.png");
    particlesMaterial.alphaMap = particleTexture;
    particlesMaterial.transparent = true;
    particles = new Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
  }

  // camera
  {
    camera = new PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(2, 2, 5);
  }

  // controls
  {
    cameraControls = new OrbitControls(camera, canvas);
    cameraControls.target = particles.position.clone();
    cameraControls.enableDamping = true;
    cameraControls.autoRotate = true;
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
      localStorage.removeItem("guiState");
      gui.reset();
    };
    gui.add({resetGui}, "resetGui").name("RESET");
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
  background: rgb(25, 25, 25);
}

.lil-gui.root > .children > .lil-gui > .title {
  color: white;
  padding-right: 180px;
}
</style>
