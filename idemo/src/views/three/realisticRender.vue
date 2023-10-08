<template>
  <canvas id="gl"></canvas>
</template>
<script setup>
import GUI from "lil-gui";
import {
  DirectionalLight,
  ReinhardToneMapping,
  NoToneMapping,
  Mesh,
  PerspectiveCamera,
  MeshStandardMaterial,
  Scene,
  WebGLRenderer,
  LinearToneMapping,
  PCFSoftShadowMap,
  CineonToneMapping,
  ACESFilmicToneMapping,
  sRGBEncoding,
  CubeTextureLoader
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import {resizeRendererToDisplaySize} from "@/utils/threeUtils/responsiveness";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {onMounted, onUnmounted} from "vue";

let canvas;
let renderer;
const scene = new Scene();
let camera;
let controls;
let stats;
const gui = new GUI({title: "🐞 Debug GUI", width: 250});
let debugObject = {};
let gltfLoader = new GLTFLoader();
let cubeTextureLoader = new CubeTextureLoader();
const directionalLight = new DirectionalLight("#ffffff", 3);

/**
 * 环境映射
 */
const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMaps/0/px.jpg",
  "/textures/environmentMaps/0/nx.jpg",
  "/textures/environmentMaps/0/py.jpg",
  "/textures/environmentMaps/0/ny.jpg",
  "/textures/environmentMaps/0/pz.jpg",
  "/textures/environmentMaps/0/nz.jpg"
]);

environmentMap.encoding = sRGBEncoding;

onMounted(() => {
  init();
});

onUnmounted(() => {
  destroy();
  if (stats.dom && stats.dom.parentElement) {
    stats.dom.parentElement.removeChild(stats.dom);
  }
});

const init = () => {
  // renderer&&scene
  canvas = document.querySelector("#gl");

  scene.background = environmentMap;
  //设置场景中所有物理材质的环境贴图。但是，无法覆盖分配给 `MeshStandardMaterial.envMap` 的现有纹理，在刷新时还是需要updateAllMaterials
  scene.environment = environmentMap;

  debugObject.envMapIntensity = 2.5;
  gui
    .add(debugObject, "envMapIntensity")
    .min(0)
    .max(10)
    .step(0.001)
    .onChange(updateAllMaterials);

  gltfLoader.load("/models/FlightHelmet/glTF/FlightHelmet.gltf", gltf => {
    gltf.scene.scale.set(10, 10, 10);
    gltf.scene.position.set(0, -4, 0);
    gltf.scene.rotation.y = Math.PI * 0.5;
    scene.add(gltf.scene);

    gui
      .add(gltf.scene.rotation, "y")
      .min(-Math.PI)
      .max(Math.PI)
      .step(0.001)
      .name("rotation");

    updateAllMaterials();
  });

  directionalLight.castShadow = true;
  directionalLight.shadow.camera.far = 15;
  directionalLight.shadow.mapSize.set(1024, 1024);
  directionalLight.shadow.normalBias = 0.05;
  directionalLight.position.set(0.25, 3, -2.25);
  scene.add(directionalLight);

  gui
    .add(directionalLight, "intensity")
    .min(0)
    .max(10)
    .step(0.001)
    .name("lightIntensity");
  gui
    .add(directionalLight.position, "x")
    .min(-5)
    .max(5)
    .step(0.001)
    .name("lightX");
  gui
    .add(directionalLight.position, "y")
    .min(-5)
    .max(5)
    .step(0.001)
    .name("lightY");
  gui
    .add(directionalLight.position, "z")
    .min(-5)
    .max(5)
    .step(0.001)
    .name("lightZ");

  camera = new PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100
  );
  camera.position.set(4, 1, -4);
  scene.add(camera);

  controls = new OrbitControls(camera, canvas);
  controls.autoRotate = false;
  controls.enableDamping = true;

  renderer = new WebGLRenderer({
    canvas: canvas,
    antialias: true
  });
  renderer.physicallyCorrectLights = true; //真实光照
  renderer.outputEncoding = sRGBEncoding;
  renderer.toneMapping = ReinhardToneMapping;
  renderer.toneMappingExposure = 3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  gui
    .add(renderer, "toneMapping", {
      No: NoToneMapping,
      Linear: LinearToneMapping,
      Reinhard: ReinhardToneMapping,
      Cineon: CineonToneMapping,
      ACESFilmic: ACESFilmicToneMapping
    })
    .onFinishChange(() => {
      renderer.toneMapping = Number(renderer.toneMapping);
      updateAllMaterials();
    });
  gui.add(renderer, "toneMappingExposure").min(0).max(10).step(0.001);

  stats = new Stats();
  stats.dom.style.left = "200px";
  canvas.parentNode.appendChild(stats.dom);

  const cameraFolder = gui.addFolder("Camera");
  cameraFolder.add(controls, "autoRotate");

  animate();
};

/**
 * 更新所有材质
 */
const updateAllMaterials = () => {
  scene.traverse(child => {
    if (
      child instanceof Mesh &&
      child.material instanceof MeshStandardMaterial
    ) {
      // child.material.envMap = environmentMap
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      child.material.envMapIntensity = debugObject.envMapIntensity;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

const animate = () => {
  requestAnimationFrame(animate);
  stats.update();

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  controls.update();
  renderer.render(scene, camera);
};

const destroy = () => {
  if (gui) gui.destroy();
};
</script>
<style>
#gl {
  width: 90.23vw;
  height: 00vh;
  display: block;
  background-color: black;
}

.lil-gui.root > .children > .lil-gui > .title {
  color: white;
  padding-right: 180px;
}
</style>
