<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div style="width: 100vw; height: 100vh; overflow: hidden; display: flex">
    <div style="flex: 1; position: relative">
      <!-- Place the three.js canvas container here -->
      <canvas id="gl"></canvas>
    </div>
    <div class="right-card">
      <router-view v-slot="{Component}">
        <transition name="el-fade-in-linear" mode="out-in">
          <component :is="Component" style="height: 100%" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AmbientLight,
  AxesHelper,
  PointsMaterial,
  Clock,
  Points,
  BufferAttribute,
  PerspectiveCamera,
  PointLight,
  Scene,
  TextureLoader,
  WebGLRenderer,
  BufferGeometry
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import * as animations from "@/utils/threeUtils/animations";
import {resizeRendererToDisplaySize} from "@/utils/threeUtils/responsiveness";
import {onMounted} from "vue";

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
let particles: Points;
let particlesGeometry: BufferGeometry;
let count: number;

onMounted(() => {
  init();
  animate();
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
    particlesGeometry = new BufferGeometry(1, 32, 32);
    count = 5000;
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
      size: 0.1,
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
  }

  // DEBUG GUI
};

const animate = () => {
  requestAnimationFrame(animate);
  // Update particles
  const elapsedTime = clock.getElapsedTime();
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    particlesGeometry.attributes.position.array[i3 + 1] = Math.sin(elapsedTime);
    const x = particlesGeometry.attributes.position.array[i3 + 0];
    particlesGeometry.attributes.position.array[i3 + 1] = Math.sin(
      elapsedTime + x
    );
  }
  particlesGeometry.attributes.position.needsUpdate = true;

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
</script>

<style scoped>
#gl {
  width: 100%;
  height: 100%;
  display: block;
  background: rgb(18, 18, 18);
}
.right-card {
  width: 400px;
  height: 100%;
  /* position: absolute;
  top: 0;
  right: 0;
  z-index: 1; */
  /* background-color: rgba(255, 255, 255, 0.848); */
  /* border-left: 1px solid #e0e0e0; */
}
</style>
