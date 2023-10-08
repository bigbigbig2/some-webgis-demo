<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import {ref, onMounted} from "vue";
import {
  Renderer,
  Camera,
  Transform,
  Texture,
  Program,
  Mesh,
  Box,
  Sphere,
  Orbit
} from "ogl";

import * as dat from "dat.gui";

const container = ref(null);
const datgui = ref(null);

const skyVertex = /* glsl */ `
        attribute vec3 position;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec3 vDir;
        void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

const skyFragment = /* glsl */ `
        precision highp float;
        uniform samplerCube tMap;
        varying vec3 vDir;
        void main() {
            vec3 tex = textureCube(tMap, vDir).rgb;
            gl_FragColor.rgb = tex;
            gl_FragColor.a = 1.0;
        }
    `;

const earthVertex = /* glsl */ `
        attribute vec2 uv; //纹理uv
        attribute vec3 position;
        attribute vec3 normal;

        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 viewMatrix;
        uniform mat3 normalMatrix;
        uniform vec3 cameraPosition;


        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPos;
        varying vec3 vCameraPos; //镜面反射计算用

        void main() {
            vUv = uv;
            vec4 pos = modelViewMatrix * vec4(position, 1.0);
            vPos = pos.xyz;
            vCameraPos = (viewMatrix * vec4(cameraPosition, 1.0)).xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * pos;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
`;

const earthFragment = /* glsl */ `
        precision highp float;

        #define MAX_LIGHT_COUNT 9
        uniform mat4 viewMatrix;

        uniform vec3 ambientLight;
        uniform vec3 directionalLightDirection[MAX_LIGHT_COUNT];
        uniform vec3 directionalLightColor[MAX_LIGHT_COUNT];
        uniform vec3 pointLightColor[MAX_LIGHT_COUNT];
        uniform vec3 pointLightPosition[MAX_LIGHT_COUNT];
        uniform vec3 pointLightDecay[MAX_LIGHT_COUNT];

        varying vec3 vNormal;
        varying vec3 vPos;
        varying vec3 vCameraPos;
        varying vec2 vUv;

        uniform sampler2D tMap;
        uniform float shininess;
        uniform float specularFactor;

        float getSpecular(vec3 dir, vec3 normal, vec3 eye) {
            vec3 reflectionLight = reflect(-dir, normal);//镜面反射反射光向量(GLSL内置函数reflect)
            float eyeCos = max(dot(eye, reflectionLight), 0.0);
            return specularFactor *  pow(eyeCos, shininess);
        }

        vec4 phongReflection(vec3 pos, vec3 normal, vec3 eye) {
            float specular = 0.0;
            vec3 diffuse = vec3(0);

            // 处理平行光
            for(int i = 0; i < MAX_LIGHT_COUNT; i++) {
            vec3 dir = directionalLightDirection[i];
            if(dir.x == 0.0 && dir.y == 0.0 && dir.z == 0.0) continue;
            vec4 d = viewMatrix * vec4(dir, 0.0);
            dir = normalize(-d.xyz);
            float cos = max(dot(dir, normal), 0.0);
            diffuse += cos * directionalLightColor[i];//平行光的漫反射
            specular += getSpecular(dir, normal, eye);//平行光的镜面反射
            }

            // 处理点光源
            for(int i = 0; i < MAX_LIGHT_COUNT; i++) {
            vec3 decay = pointLightDecay[i];
            if(decay.x == 0.0 && decay.y == 0.0 && decay.z == 0.0) continue;
            vec3 dir = (viewMatrix * vec4(pointLightPosition[i], 1.0)).xyz - pos;
            float dis = length(dir);
            dir = normalize(dir);
            float cos = max(dot(dir, normal), 0.0);
            float d = min(1.0, 1.0 / (decay.x * pow(dis, 2.0) + decay.y * dis + decay.z));
            diffuse += d * cos * pointLightColor[i];
            specular += getSpecular(dir, normal, eye);
            }

            return vec4(diffuse, specular);
        }

        void main() {
            vec3 tex = texture2D(tMap, vUv).rgb;

            vec3 eyeDirection = normalize(vCameraPos - vPos);
            vec4 phong = phongReflection(vPos, vNormal, eyeDirection);

            // 合成颜色
            gl_FragColor.rgb = phong.w + (phong.xyz + ambientLight) * tex;
            gl_FragColor.a = 1.0;
        }

`;

class Phong {
  constructor(ambientLight = [0.4, 0.4, 0.4]) {
    this.ambientLight = ambientLight; //环境光
    this.directionalLights = new Set(); //平行光
    this.pointLights = new Set(); //点光源
  }

  addLight(light) {
    const {position, direction, color, decay} = light;
    if (!position && !direction) throw new TypeError("invalid light");
    light.color = color || [1, 1, 1];
    if (!position) this.directionalLights.add(light); //平行光不需要提供position
    else {
      light.decay = decay || [0, 0, 1]; //点光源的衰减
      this.pointLights.add(light);
    }
  }

  removeLight(light) {
    if (this.directionalLights.has(light)) this.directionalLights.delete(light);
    else if (this.pointLights.has(light)) this.pointLights.delete(light);
  }

  get uniforms() {
    const MAX_LIGHT_COUNT = 9; // 最多每种光源设置9个
    this._lightData = this._lightData || {};

    const lightData = this._lightData;

    lightData.directionalLightDirection =
      lightData.directionalLightDirection || {
        value: new Float32Array(MAX_LIGHT_COUNT * 3)
      };
    lightData.directionalLightColor = lightData.directionalLightColor || {
      value: new Float32Array(MAX_LIGHT_COUNT * 3)
    };

    lightData.pointLightPosition = lightData.pointLightPosition || {
      value: new Float32Array(MAX_LIGHT_COUNT * 3)
    };
    lightData.pointLightColor = lightData.pointLightColor || {
      value: new Float32Array(MAX_LIGHT_COUNT * 3)
    };
    lightData.pointLightDecay = lightData.pointLightDecay || {
      value: new Float32Array(MAX_LIGHT_COUNT * 3)
    };

    [...this.directionalLights].forEach((light, idx) => {
      lightData.directionalLightDirection.value.set(light.direction, idx * 3);
      lightData.directionalLightColor.value.set(light.color, idx * 3);
    });

    [...this.pointLights].forEach((light, idx) => {
      lightData.pointLightPosition.value.set(light.position, idx * 3);
      lightData.pointLightColor.value.set(light.color, idx * 3);
      lightData.pointLightDecay.value.set(light.decay, idx * 3);
    });

    return {
      ambientLight: {value: this.ambientLight}, //环境光默认
      ...lightData
    };
  }
}

onMounted(() => {
  const phong = new Phong();

  // 添加一个平行光
  // phong.addLight({
  //   direction: [-1, 0, 0],
  // });
  // // 添加两个点光源
  // phong.addLight({
  //   position: [-3, 3, 0],
  //   color: [0.5, 1, 1],
  // });

  // phong.addLight({
  //   position: [3, 3, 0],
  //   color: [1, 0.5, 1],
  // });

  const renderer = new Renderer({dpr: 2});
  const gl = renderer.gl;

  container.value.appendChild(gl.canvas);
  // document.getElementById("container").appendChild(gl.canvas);
  gl.clearColor(1, 1, 1, 1);

  const camera = new Camera(gl, {fov: 45});
  camera.position.set(-2, 1, -3);

  const controls = new Orbit(camera); //默认的zoomStyle为

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
  }
  window.addEventListener("resize", resize, false);
  resize();

  const scene = new Transform();

  // Create an empty texture using the gl.TEXTURE_CUBE_MAP target
  const texture = new Texture(gl, {
    target: gl.TEXTURE_CUBE_MAP
  });

  const earthTxeture = new Texture(gl);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => (earthTxeture.image = img);
  img.src = "/earth.jpg";

  loadImages();
  async function loadImages() {
    function loadImage(src) {
      return new Promise(res => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });
    }

    const images = await Promise.all([
      loadImage("/skybox/posx.png"),
      loadImage("/skybox/negx.png"),
      loadImage("/skybox/posy.png"),
      loadImage("/skybox/negy.png"),
      loadImage("/skybox/posz.png"),
      loadImage("/skybox/negz.png")
    ]);

    // Once all are loaded, we can update the texture image, which will upload them
    texture.image = images;
  }

  const skyGeometry = new Box(gl);
  const earthGeometry = new Sphere(gl, {
    radius: 1,
    widthSegments: 64
  });

  const skyProgram = new Program(gl, {
    vertex: skyVertex,
    fragment: skyFragment,
    uniforms: {
      tMap: {value: texture}
    },
    cullFace: null
  });

  const earthProgram = new Program(gl, {
    vertex: earthVertex,
    fragment: earthFragment,
    uniforms: {
      tMap: {value: earthTxeture},
      ...phong.uniforms,
      specularFactor: {value: 10.0}, //镜面反射强度
      shininess: {value: 800.0} //镜面反射光洁度
    }
  });
  const skybox = new Mesh(gl, {
    geometry: skyGeometry,
    program: skyProgram
  });
  skybox.setParent(scene);
  skybox.scale.set(40);

  const mesh = new Mesh(gl, {
    geometry: earthGeometry,
    program: earthProgram
  });
  mesh.setParent(scene);

  requestAnimationFrame(update);
  function update() {
    requestAnimationFrame(update);

    controls.update();

    mesh.rotation.y += 0.0003;
    renderer.render({scene, camera});
  }

  const gui = new dat.GUI();
  datgui.value.appendChild(gui.domElement);
  const palette = {
    ambientLight: 0.4,
    directionalLight: false,
    specularFactor: 10.0,
    shininess: 800,
    pointLights: false
  };
  let isChecked = false;
  let isChecked2 = false;
  gui.add(palette, "ambientLight", 0, 1, 0.1).onChange(val => {
    earthProgram.uniforms.ambientLight.value = [val, val, val];
  });
  const controller = gui
    .add(palette, "directionalLight")
    .onChange(function (value) {
      if (isChecked) {
        palette.directionalLight = false; // 禁用勾选框
        return; // 退出回调函数
      }
      if (value) {
        phong.addLight({
          direction: [-1, 0, 0]
        });
        earthProgram.uniforms = {
          tMap: {value: earthTxeture},
          ...phong.uniforms,
          specularFactor: {value: 10.0}, //镜面反射强度
          shininess: {value: 800.0} //镜面反射光洁度
        };
        controller.__checkbox.disabled = true;
        isChecked = true;
      }
    });

  const controller2 = gui
    .add(palette, "pointLights")
    .onChange(function (value) {
      if (isChecked2) {
        palette.pointLights = false; // 禁用勾选框
        return; // 退出回调函数
      }
      if (value) {
        phong.addLight({
          position: [-3, 3, 0],
          color: [0.5, 1, 1]
        });
        earthProgram.uniforms = {
          tMap: {value: earthTxeture},
          ...phong.uniforms,
          specularFactor: {value: 10.0}, //镜面反射强度
          shininess: {value: 800.0} //镜面反射光洁度
        };
        controller2.__checkbox.disabled = true;
        isChecked2 = true;
      }
    });

  const folder = gui.addFolder("镜面反射强度、光洁度");
  folder.add(palette, "specularFactor", 1, 200, 2).onChange(val => {
    earthProgram.uniforms.specularFactor.value = val;
  });
  folder.add(palette, "shininess", 20, 1000, 2).onChange(val => {
    earthProgram.uniforms.shininess.value = val;
  });
});
</script>
<template>
  <!-- <div v-loading="loading"
        element-loading-text="Loading..."
        element-loading-background="rgba(0, 0, 0, 0.8)"> -->
  <div id="container" ref="container">
    <div id="datgui" ref="datgui"></div>
  </div>

  <!-- </div> -->
</template>
<style scoped lang="scss">
#container {
  height: 100vh;
  margin: 0;
  overflow: hidden;
  #datgui {
    position: absolute;
    z-index: 100;
    right: 2px;
    top: 2px;
  }
}
</style>
