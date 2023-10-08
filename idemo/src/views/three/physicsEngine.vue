<template>
  <canvas id="gl"></canvas>
</template>
<script setup lang="ts">
import GUI from "lil-gui";
import * as CANNON from "cannon-es";
import {
  AmbientLight,
  DirectionalLight,
  BoxGeometry,
  Clock,
  LoadingManager,
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import {resizeRendererToDisplaySize} from "@/utils/threeUtils/responsiveness";
import {onMounted, onUnmounted} from "vue";

let canvas: HTMLCanvasElement;
let renderer: WebGLRenderer;
let scene: Scene;
let loadingManager: LoadingManager;
let ambientLight: AmbientLight;
let directionalLight: DirectionalLight;
let camera: PerspectiveCamera;
let cameraControls: OrbitControls;
let clock: Clock;
let stats: Stats;
let gui: GUI;
let world: CANNON.World;
let playHitSound;
const objectsToUpdate = [];
let sphereGeometry: SphereGeometry;
let sphereMaterial: MeshStandardMaterial;
let boxGeometry: BoxGeometry;
let boxMaterial: MeshStandardMaterial;
let oldElapsedTime = 0;
let defaultMaterial: CANNON.Material;

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

    //平行光
    directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    // directionalLight.position.set(100, 60, 50);
    directionalLight.castShadow = true;

    scene.add(ambientLight);
    scene.add(directionalLight);
  }
  //Sounds
  {
    const hitSound = new Audio("/sounds/hit.mp3");
    let hasUserInteracted = false;

    // 用户与页面的任何交互都会触发此函数，确保音效可以播放
    const initializeAudioPlayback = () => {
      hitSound
        .play()
        .then(() => {
          hitSound.pause();
          hitSound.currentTime = 0;
          hasUserInteracted = true;

          // 只需要进行一次初始化，因此移除事件监听器
          document.removeEventListener("click", initializeAudioPlayback);
          document.removeEventListener("touchstart", initializeAudioPlayback);
        })
        .catch(error => {
          console.error("Audio initiation failed:", error);
        });
    };

    // 添加事件监听器以捕获用户与页面的首次交互
    document.addEventListener("click", initializeAudioPlayback);
    document.addEventListener("touchstart", initializeAudioPlayback); // 对触摸设备进行优化

    playHitSound = collision => {
      if (!hasUserInteracted) return; // 如果用户尚未与文档交互，则不播放音效

      const impactStrength = collision.contact.getImpactVelocityAlongNormal();
      if (impactStrength > 1.5) {
        hitSound.volume = Math.random();
        hitSound.currentTime = 0;
        hitSound.play();
      }
    };
  }

  //Physics
  {
    world = new CANNON.World();
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = true;
    world.gravity.set(0, -9.82, 0);

    // Default material
    defaultMaterial = new CANNON.Material("default");
    const defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.1,
        restitution: 0.7
      }
    );
    world.defaultContactMaterial = defaultContactMaterial;

    // Floor
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body();
    floorBody.mass = 0;
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(-1, 0, 0),
      Math.PI * 0.5
    );
    world.addBody(floorBody);
  }

  //object
  {
    // Create sphere
    sphereGeometry = new SphereGeometry(1, 20, 20);
    sphereMaterial = new MeshStandardMaterial({
      metalness: 0.3,
      roughness: 0.4,
      envMapIntensity: 0.5
    });

    // Create box
    boxGeometry = new BoxGeometry(1, 1, 1);
    boxMaterial = new MeshStandardMaterial({
      metalness: 0.3,
      roughness: 0.4,
      envMapIntensity: 0.5
    });

    createBox(1, 1.5, 2, {x: 0, y: 3, z: 0});

    /**
     * Floor
     */
    const floor = new Mesh(
      new PlaneGeometry(10, 10),
      new MeshStandardMaterial({
        color: "#777777",
        metalness: 0.3,
        roughness: 0.4,
        // envMap: environmentMapTexture,
        envMapIntensity: 0.5
      })
    );
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI * 0.5;
    scene.add(floor);
  }

  // camera
  {
    camera = new PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(-6, 3, -2);
  }

  // controls
  {
    cameraControls = new OrbitControls(camera, canvas);
    cameraControls.enableDamping = true;
    cameraControls.update();
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

    const debugObject = {};
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    debugObject.createSphere = () => {
      createSphere(Math.random() * 0.5, {
        x: (Math.random() - 0.5) * 3,
        y: 3,
        z: (Math.random() - 0.5) * 3
      });
    };

    gui.add(debugObject, "createSphere");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    debugObject.createBox = () => {
      createBox(Math.random(), Math.random(), Math.random(), {
        x: (Math.random() - 0.5) * 3,
        y: 3,
        z: (Math.random() - 0.5) * 3
      });
    };
    gui.add(debugObject, "createBox");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    // Reset
    debugObject.reset = () => {
      for (const object of objectsToUpdate) {
        // Remove body
        object.body.removeEventListener("collide", playHitSound);
        world.removeBody(object.body);

        // Remove mesh
        scene.remove(object.mesh);
      }
    };
    gui.add(debugObject, "reset");
  }
};

const animate = () => {
  requestAnimationFrame(animate);
  stats.update();

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // Update physics
  world.step(1 / 60, deltaTime, 3);

  for (const object of objectsToUpdate) {
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
  }

  cameraControls.update();
  renderer.render(scene, camera);
};

const destroy = () => {
  if (gui) gui.destroy();
};

const createSphere = (radius, position) => {
  // js mesh
  const mesh = new Mesh(sphereGeometry, sphereMaterial);
  mesh.castShadow = true;
  mesh.scale.set(radius, radius, radius);
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js body
  const shape = new CANNON.Sphere(radius);

  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 0),
    shape: shape,
    material: defaultMaterial
  });
  body.position.copy(position);
  body.addEventListener("collide", playHitSound);
  world.addBody(body);

  // Save in objects
  objectsToUpdate.push({mesh, body});
};

const createBox = (width, height, depth, position) => {
  // js mesh
  const mesh = new Mesh(boxGeometry, boxMaterial);
  mesh.scale.set(width, height, depth);
  mesh.castShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js body
  const shape = new CANNON.Box(
    new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5)
  );

  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 0),
    shape: shape,
    material: defaultMaterial
  });
  body.position.copy(position);
  body.addEventListener("collide", playHitSound);
  world.addBody(body);

  // Save in objects
  objectsToUpdate.push({mesh, body});
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
