<template>
  <canvas id="gl"></canvas>
</template>
<script setup>
import GUI from "lil-gui";
import {
  DirectionalLight,
  AxesHelper,
  Clock,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PerspectiveCamera,
  TextureLoader,
  PCFShadowMap,
  RGBADepthPacking,
  ACESFilmicToneMapping,
  CubeTextureLoader,
  Scene,
  WebGLRenderer,
  MeshDepthMaterial
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {resizeRendererToDisplaySize} from "@/utils/threeUtils/responsiveness";
import {onMounted, onUnmounted} from "vue";

let canvas;
let renderer;
let scene;
let camera;
let cameraControls;
let axesHelper;
let clock;
let stats;
let gui;
let material;
let directionalLight;
let depthMaterial;
const textureLoader = new TextureLoader();
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new CubeTextureLoader();
/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMaps/0/px.jpg",
  "/textures/environmentMaps/0/nx.jpg",
  "/textures/environmentMaps/0/py.jpg",
  "/textures/environmentMaps/0/ny.jpg",
  "/textures/environmentMaps/0/pz.jpg",
  "/textures/environmentMaps/0/nz.jpg"
]);
const mapTexture = textureLoader.load("/models/LeePerrySmith/color.jpg");
const normalTexture = textureLoader.load("/models/LeePerrySmith/normal.jpg");

const customUniforms = {
  uTime: {value: 0}
};

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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.useLegacyLights = true;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    scene = new Scene();

    scene.background = environmentMap; //设定环境映射图片
    scene.environment = environmentMap; //环境映射到场景中效果
  }

  //object
  {
    // 标准网格材质
    material = new MeshStandardMaterial({
      map: mapTexture,
      normalMap: normalTexture
    });

    //修改标准网格材质的内置着色器代码，直接拖replace大法添加
    material.onBeforeCompile = shader => {
      shader.uniforms.uTime = customUniforms.uTime;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
        #include <common>
        uniform float uTime;

        mat2 get2dRotateMatrix(float _angle){
            return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
        }
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        float angle = (position.y + uTime) * 0.9;
        mat2 rotateMatrix = get2dRotateMatrix(angle);
        transformed.xz = rotateMatrix * transformed.xz;
        `
      );
      // console.log(shader.vertexShader)
    };

    depthMaterial = new MeshDepthMaterial({
      depthPacking: RGBADepthPacking
    });

    //加载glb模型
    gltfLoader.load("/models/LeePerrySmith/LeePerrySmith.glb", gltf => {
      // Model
      const mesh = gltf.scene.children[0];
      mesh.rotation.y = Math.PI * 0.5;
      mesh.material = material;
      mesh.customDepthMaterial = depthMaterial; // Update the depth material
      scene.add(mesh);

      // Update materials
      updateAllMaterials();
    });

    depthMaterial.onBeforeCompile = shader => {
      shader.uniforms.uTime = customUniforms.uTime;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
        #include <common>

        uniform float uTime;

        mat2 get2dRotateMatrix(float _angle){
            return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
        }
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        `
        #include <beginnormal_vertex>

        float angle = (position.y + uTime) * 0.9;
        mat2 rotateMatrix = get2dRotateMatrix(angle);

        objectNormal.xz = rotateMatrix * objectNormal.xz;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        float angle = (position.y + uTime) * 0.9;
        mat2 rotateMatrix = get2dRotateMatrix(angle);
        transformed.xz = rotateMatrix * transformed.xz;
        `
      );
    };

    //辅助的平面
    const plane = new Mesh(
      new PlaneGeometry(15, 15, 15),
      new MeshStandardMaterial()
    );
    plane.rotation.y = Math.PI;
    plane.position.y = -5;
    plane.position.z = 5;
    scene.add(plane);
  }

  //light
  {
    directionalLight = new DirectionalLight("#ffffff", 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.far = 15;
    directionalLight.shadow.normalBias = 0.05;
    directionalLight.position.set(0.25, 2, -2.25);
    scene.add(directionalLight);
  }

  // camera
  {
    camera = new PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(4, 1, -4);
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
  customUniforms.uTime.value = elapsedTime;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  cameraControls.update();
  renderer.render(scene, camera);
};

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse(child => {
    if (
      child instanceof Mesh &&
      child.material instanceof MeshStandardMaterial
    ) {
      child.material.envMapIntensity = 1; //环境映射
      child.material.needsUpdate = true; //更新材质
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
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
