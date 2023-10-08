<template>
  <canvas id="gl"></canvas>
</template>
<script setup lang="ts">
import GUI from "lil-gui";
import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  BoxGeometry,
  Clock,
  GridHelper,
  LoadingManager,
  SpotLight,
  SpotLightHelper,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  PointLightHelper,
  Scene,
  WebGLRenderer
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
let loadingManager: LoadingManager;
let ambientLight: AmbientLight;
let pointLight: PointLight;
let spotLight: SpotLight;
let directionalLight: DirectionalLight;
let cube: Mesh;
let camera: PerspectiveCamera;
let cameraControls: OrbitControls;
// let dragControls;
let axesHelper: AxesHelper;
let pointLightHelper: PointLightHelper;
let spotLightHelper: SpotLightHelper;
// let cameraHelper;
let clock: Clock;
let stats: Stats;
let gui: GUI;

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
    canvas = document.querySelector("#gl") as HTMLCanvasElement;
    renderer = new WebGLRenderer({canvas, antialias: true, alpha: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true; //开启阴影渲染
    renderer.shadowMap.type = PCFSoftShadowMap; //阴影映射的类型
    scene = new Scene();
  }

  // LoadingManager
  {
    loadingManager = new LoadingManager();

    loadingManager.onStart = () => {
      console.log("loading started");
    };
    loadingManager.onProgress = (url, loaded, total) => {
      console.log("loading in progress:");
      console.log(`${url} -> ${loaded} / ${total}`);
    };
    loadingManager.onLoad = () => {
      console.log("loaded!");
    };
    loadingManager.onError = () => {
      console.log("❌ error while loading");
    };
  }

  // light
  {
    //环境光
    ambientLight = new AmbientLight("white", 0.4);

    //点光源
    pointLight = new PointLight("#ffdca8", 1.2, 100);
    pointLight.position.set(-2, 3, 3);
    pointLight.castShadow = true; //开启阴影投射
    pointLight.shadow.radius = 4; //设置软阴影的半径
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 4000;
    //设置阴影贴图的大小，值越大阴影的质量越高，但同时也会更消耗性能。
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;

    //聚光灯
    spotLight = new SpotLight(0xffffff, 1.0);
    spotLight.intensity = 1.0; //光照强度
    spotLight.angle = Math.PI / 6; //发散角度：光锥角度的二分之一
    spotLight.position.set(4, 5, 8);
    spotLight.castShadow = true;

    //平行光
    directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    // directionalLight.position.set(100, 60, 50);
    directionalLight.castShadow = true;

    scene.add(spotLight);
    scene.add(ambientLight);
    scene.add(pointLight);
    scene.add(directionalLight);
  }

  //object
  {
    const sideLength = 1;
    const cubeGeometry = new BoxGeometry(sideLength, sideLength, sideLength);
    const cubeMaterial = new MeshStandardMaterial({
      color: "#f69f1f",
      metalness: 0.5,
      roughness: 0.7
    });
    cube = new Mesh(cubeGeometry, cubeMaterial);
    cube.castShadow = true;
    cube.position.y = 0.5;

    const planeGeometry = new PlaneGeometry(6, 6);
    const planeMaterial = new MeshLambertMaterial({
      color: "gray",
      emissive: "teal",
      emissiveIntensity: 0.2,
      side: 2,
      transparent: true,
      opacity: 0.4
    });
    const plane = new Mesh(planeGeometry, planeMaterial);
    plane.rotateX(Math.PI / 2);
    plane.receiveShadow = true;

    console.log("cube", cube);

    scene.add(cube);
    scene.add(plane);
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
    cameraControls.target = cube.position.clone();
    cameraControls.enableDamping = true;
    cameraControls.autoRotate = true;
    cameraControls.update();
  }

  // helpers
  {
    axesHelper = new AxesHelper(4);
    axesHelper.visible = false;
    scene.add(axesHelper);

    pointLightHelper = new PointLightHelper(pointLight, undefined, "orange");
    pointLightHelper.visible = false;
    scene.add(pointLightHelper);

    spotLightHelper = new SpotLightHelper(spotLight, 0xffffff);
    spotLightHelper.visible = false;
    scene.add(spotLightHelper);

    //可视化平行光阴影对应的正投影相机对象
    // const cameraHelper = new CameraHelper(directionalLight.shadow.camera);
    // cameraHelper.visible = false
    // scene.add(cameraHelper);

    const gridHelper = new GridHelper(20, 20, "teal", "darkgray");
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);
  }

  // STATS & CLOCK
  {
    clock = new Clock();
    stats = new Stats();
    stats.dom.style.left = "200px";
    canvas.parentNode.appendChild(stats.dom);
  }

  //DEBUG GUI
  {
    gui = new GUI({title: "🐞 Debug GUI", width: 250});

    const lightsFolder = gui.addFolder("Lights");
    lightsFolder.add(pointLight, "visible").name("point light");
    lightsFolder.add(ambientLight, "visible").name("ambient light");
    lightsFolder.add(spotLight, "visible").name("spotLight light");
    lightsFolder.add(directionalLight, "visible").name("directional light");

    const helpersFolder = gui.addFolder("Helpers");
    helpersFolder.add(axesHelper, "visible").name("axes");
    helpersFolder.add(pointLightHelper, "visible").name("pointLightHelper");
    helpersFolder.add(spotLightHelper, "visible").name("spotLightHelper");
    // helpersFolder.add(cameraHelper, 'visible').name('directionalLightHelper')

    const cameraFolder = gui.addFolder("Camera");
    cameraFolder.add(cameraControls, "autoRotate");

    // reset GUI state button
    const resetGui = () => {
      localStorage.removeItem("guiState");
      gui.reset();
    };
    gui.add({resetGui}, "resetGui").name("RESET");

    // gui.close();
  }
};

const animate = () => {
  requestAnimationFrame(animate);
  stats.update();
  if (animation.enabled && animation.play) {
    animations.rotate(cube, clock, Math.PI / 3);
    animations.bounce(cube, clock, 1, 0.5, 0.5);
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

  scene.traverse(child => {
    if (child instanceof Mesh) {
      child.geometry.dispose();

      for (const key in child.material) {
        const value = child.material[key];

        if (value && typeof value.dispose === "function") {
          value.dispose();
        }
      }
    }
  });
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
