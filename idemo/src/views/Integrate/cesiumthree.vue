<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="containerC">
    <div ref="cesiumContainer" class="cesium-container"></div>
    <div ref="threeContainer" class="three-container"></div>
  </div>
  <!-- <button @click="getPositions()">发</button> -->
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import "cesium/Build/CesiumUnminified/Widgets/widgets.css";
import {Cartesian3, Math, ShadowMode} from "cesium";
import {
  Scene,
  PerspectiveCamera,
  Vector3,
  WebGLRenderer,
  AmbientLight,
  // AnimationMixer,
  // AxesHelper,
  MeshNormalMaterial,
  BoxGeometry,
  // MeshStandardMaterial,
  Mesh,
  Group,
  PCFSoftShadowMap,
  DirectionalLight,
  PointLight,
  SpotLight
} from "three";
import {useCesiumStore} from "@/store/cesium";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader.js";

window.CESIUM_BASE_URL = "libs/cesium/";
const cesiumStore = useCesiumStore();

const cesiumContainer = ref<HTMLDivElement>();
const threeContainer = ref<HTMLDivElement>();

// three对象
let three = {
  renderer: null,
  camera: null,
  scene: null
};

// 模型定位范围
let minWGS84 = [105.23, 23.55];
let maxWGS84 = [107.23, 26.55];

let _3Dobjects = []; //存储three.js中的3Dobject

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// let mixer = null;

onMounted(() => {
  initCesium();
  initThree();
  initThreeObjects();
  startRenderLoop();
});

// const getPositions = () => {
//   console.log(
//     cesiumStore.viewer.camera.position,
//     cesiumStore.viewer.camera.heading,
//     cesiumStore.viewer.camera.pitch,
//     cesiumStore.viewer.camera.roll
//   );
// };

function _3DObject() {
  this.threeMesh = null;
  this.minWGS84 = null;
  this.maxWGS84 = null;
}

const initCesium = () => {
  cesiumStore.initViewer(cesiumContainer.value as HTMLElement, {
    useDefaultRenderLoop: false, //关闭默认渲染循环
    allowTextureFilterAnisotropic: false,
    // contextOptions: {
    //   webgl: {
    //     alpha: false,
    //     antialias: true,
    //     preserveDrawingBuffer: true,
    //     failIfMajorPerformanceCaveat: false,
    //     depth: true,
    //     stencil: false,
    //     anialias: false
    //   }
    // },
    targetFrameRate: 60,
    orderIndependentTranslucency: true,
    automaticallyTrackDataSourceClocks: false,
    dataSources: null,
    clock: null,
    terrainShadows: ShadowMode.DISABLED
  });

  cesiumStore.viewer.scene.debugShowFramesPerSecond = true;

  // cesiumStore.viewer.camera.flyTo({
  //   destination: Cartesian3.fromDegrees(
  //     (minWGS84[0] + maxWGS84[0]) / 2,
  //     (minWGS84[1] + maxWGS84[1]) / 2 - 1.25,
  //     200000
  //   ),
  //   orientation: {
  //     heading: Math.toRadians(0),
  //     pitch: Math.toRadians(-60),
  //     roll: Math.toRadians(0)
  //   },
  //   duration: 3
  // });
  cesiumStore.viewer.camera.setView({
    // 设置相机位置
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    destination: {
      x: -1621088.1223693471,
      y: 5549956.304614017,
      z: 2688154.0360511034
    },
    orientation: {
      // 初始视角
      heading: 4.060505987926523,
      pitch: -0.25042708182866047,
      roll: 0.000015209352906886409
    }
  });
};

const initThree = () => {
  let fov = 45;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let aspect = width / height;
  let near = 1;
  let far = 10 * 1000 * 1000;
  three.scene = new Scene();
  three.camera = new PerspectiveCamera(fov, aspect, near, far);
  three.renderer = new WebGLRenderer({alpha: true});
  three.renderer.shadowMap.enabled = true; //开启阴影渲染
  three.renderer.shadowMap.type = PCFSoftShadowMap; //阴影映射的类型

  //light

  const ambientLight = new AmbientLight("white", 0.4);

  //点光源
  const pointLight = new PointLight("#ffdca8", 1.2, 100);
  pointLight.position.set(-2, 3, 3);
  pointLight.castShadow = true; //开启阴影投射
  pointLight.shadow.radius = 4; //设置软阴影的半径
  pointLight.shadow.camera.near = 0.5;
  pointLight.shadow.camera.far = 4000;
  //设置阴影贴图的大小，值越大阴影的质量越高，但同时也会更消耗性能。
  pointLight.shadow.mapSize.width = 2048;
  pointLight.shadow.mapSize.height = 2048;

  //聚光灯
  const spotLight = new SpotLight(0xffffff, 1.0);
  spotLight.intensity = 1.0; //光照强度
  spotLight.angle = Math.PI / 6; //发散角度：光锥角度的二分之一
  spotLight.position.set(800, 500, 800);
  spotLight.castShadow = true;

  //平行光
  const directionalLight = new DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1000, 1000, 1000);
  directionalLight.castShadow = true;

  three.scene.add(spotLight);
  three.scene.add(ambientLight);
  three.scene.add(pointLight);
  three.scene.add(directionalLight);
  // let Amlight = new AmbientLight(0xffffff, 2);
  // three.scene.add(Amlight);

  //连个画布，兄弟节点关系，进行重叠
  threeContainer.value.appendChild(three.renderer.domElement);
};

// const addBoxEntity = () => {
//   cesiumStore.viewer.entities.add({
//     name: "Box",
//     position: Cartesian3.fromDegrees(
//       (minWGS84[0] + maxWGS84[0]) / 2,
//       (minWGS84[1] + maxWGS84[1]) / 2 - 0.5,
//       7000
//     ),
//     box: {
//       dimensions: new Cartesian3(16000.0, 16000.0, 16000.0),
//       material: Color.RED.withAlpha(0.5),
//       fill: true,
//       outline: true,
//       outlineColor: Color.BLACK,
//       outlineWidth: 1.0
//     }
//   });
// };

// const addPolygonEntity = () => {
//   cesiumStore.viewer.entities.add({
//     name: "Polygon",
//     polygon: {
//       hierarchy: Cartesian3.fromDegreesArray([
//         minWGS84[0],
//         minWGS84[1],
//         maxWGS84[0],
//         minWGS84[1],
//         maxWGS84[0],
//         maxWGS84[1],
//         minWGS84[0],
//         maxWGS84[1]
//       ]),
//       material: Color.PINK.withAlpha(0.4)
//     }
//   });
// };

const addBoxGeometry = () => {
  const geometry = new BoxGeometry();
  const material = new MeshNormalMaterial();
  const dodecahedronMesh = new Mesh(geometry, material);
  dodecahedronMesh.scale.set(1500, 1500, 1500); // scale object to be visible at planet scale
  dodecahedronMesh.position.z += 750.0; //注意这里需要根据你模型的缩放大小来修改，调试到模型贴地并不飘
  dodecahedronMesh.rotation.x = Math.PI / 2; // rotate mesh for Cesium's Y-up system
  let dodecahedronMeshYup = new Group();
  dodecahedronMeshYup.add(dodecahedronMesh);
  three.scene.add(dodecahedronMeshYup); // don’t forget to add it to the Three.js scene manually
  // Assign Three.js object mesh to our object array
  let _3DOB = new _3DObject();
  _3DOB.threeMesh = dodecahedronMeshYup;
  _3DOB.minWGS84 = minWGS84;
  _3DOB.maxWGS84 = maxWGS84;
  _3Dobjects.push(_3DOB);
};

// const addFoxModel = () => {
//   gltfLoader.load("/models/Fox/glTF/Fox.gltf", gltf => {
//     gltf.scene.scale.set(1500, 1500, 1500);

//     three.scene.add(gltf.scene);

//     // Animation
//     mixer = new AnimationMixer(gltf.scene);
//     const action = mixer.clipAction(gltf.animations[2]);
//     action.play();
//   });
// };

const initThreeObjects = () => {
  // Cesium entity
  // addPolygonEntity();
  // addBoxEntity();
  // Three.js Objects
  addBoxGeometry();
  // addFoxModel();

  // let entity = {
  //   name: "Polygon",
  //   polygon: {
  //     hierarchy: Cartesian3.fromDegreesArray([
  //       minWGS84[0],
  //       minWGS84[1],
  //       maxWGS84[0],
  //       minWGS84[1],
  //       maxWGS84[0],
  //       maxWGS84[1],
  //       minWGS84[0],
  //       maxWGS84[1]
  //     ]),
  //     material: Color.BLUE.withAlpha(0.2)
  //   }
  // };
  // cesiumStore.viewer.entities.add(entity);
  // createCubeMesh();
};

//将三维笛卡尔坐标转化为三维向量

const cartToVec = function (cart) {
  return new Vector3(cart.x, cart.y, cart.z);
};

const renderCesium = () => {
  cesiumStore.viewer.render();
};

const renderThree = () => {
  //同步相机fov
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  three.camera.fov = Math.toDegrees(cesiumStore.viewer.camera.frustum.fovy);

  for (let id in _3Dobjects) {
    minWGS84 = _3Dobjects[id].minWGS84;
    maxWGS84 = _3Dobjects[id].maxWGS84;
    // convert lat/long center position to Cartesian3
    let center = Cartesian3.fromDegrees(
      (minWGS84[0] + maxWGS84[0]) / 2,
      (minWGS84[1] + maxWGS84[1]) / 2
    );
    // get forward direction for orienting model
    let centerHigh = Cartesian3.fromDegrees(
      (minWGS84[0] + maxWGS84[0]) / 2,
      (minWGS84[1] + maxWGS84[1]) / 2,
      1
    );
    // use direction from bottom left to top left as up-vector
    let bottomLeft = cartToVec(
      Cartesian3.fromDegrees(minWGS84[0], minWGS84[1])
    );
    let topLeft = cartToVec(Cartesian3.fromDegrees(minWGS84[0], maxWGS84[1]));
    let latDir = new Vector3().subVectors(bottomLeft, topLeft).normalize();
    // configure entity position and orientation
    _3Dobjects[id].threeMesh.position.copy(center);
    _3Dobjects[id].threeMesh.lookAt(centerHigh.x, centerHigh.y, centerHigh.z);
    _3Dobjects[id].threeMesh.up.copy(latDir);
  }
  // Clone Cesium Camera projection position so the
  // Three.js Object will appear to be at the same place as above the Cesium Globe
  three.camera.matrixAutoUpdate = false;
  let cvm = cesiumStore.viewer.camera.viewMatrix;
  let civm = cesiumStore.viewer.camera.inverseViewMatrix;

  three.camera.lookAt(0, 0, 0);

  three.camera.matrixWorld.set(
    civm[0],
    civm[4],
    civm[8],
    civm[12],
    civm[1],
    civm[5],
    civm[9],
    civm[13],
    civm[2],
    civm[6],
    civm[10],
    civm[14],
    civm[3],
    civm[7],
    civm[11],
    civm[15]
  );

  three.camera.matrixWorldInverse.set(
    cvm[0],
    cvm[4],
    cvm[8],
    cvm[12],
    cvm[1],
    cvm[5],
    cvm[9],
    cvm[13],
    cvm[2],
    cvm[6],
    cvm[10],
    cvm[14],
    cvm[3],
    cvm[7],
    cvm[11],
    cvm[15]
  );

  let width = cesiumContainer.value.clientWidth;
  let height = cesiumContainer.value.clientHeight;

  let aspect = width / height;
  three.camera.aspect = aspect;
  three.camera.updateProjectionMatrix();
  three.renderer.setSize(width, height);
  three.renderer.clear();
  three.renderer.render(three.scene, three.camera);
};

const startRenderLoop = () => {
  requestAnimationFrame(startRenderLoop);
  renderCesium();
  renderThree();
};
</script>

<style scoped>
.containerC {
  width: 90.23vw;
  height: 100vh;
}

.three-container {
  position: absolute;
  top: 0;
  pointer-events: none;
}
.cesium-container {
  width: 100%;
  height: 100%;
}
/* .container-integrate canvas {
    position: absolute;
    top: 0;
  } */

/*three画布禁止鼠标操作*/
/* .container-integrate canvas:nth-child(3) {
    pointer-events: none;
  } */
</style>
