import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import EventEmitter from "./EventEmitter.js";

// 定义资源接口
interface Source {
  name: string;
  type: string;
  path: string;
}

export default class Resources extends EventEmitter {
  sources: Source[];
  items;
  private toLoad: number;
  private loaded: number;
  loaders;

  constructor(sources: Source[]) {
    super();

    this.sources = sources;

    this.items = {}; //要加载的sources
    this.toLoad = this.sources.length;
    this.loaded = 0;

    this.setLoaders();
    this.startLoading();
  }

  setLoaders() {
    //根据项目需要的loader创建
    this.loaders = {};
    this.loaders.gltfLoader = new GLTFLoader();
    this.loaders.textureLoader = new THREE.TextureLoader();
    this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader();
  }

  /**
   * 遍历 sources 数组并使用相应的加载器加载它们
   */
  startLoading() {
    // Load each source
    for (const source of this.sources) {
      if (source.type === "gltfModel") {
        this.loaders.gltfLoader.load(source.path, file => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === "texture") {
        this.loaders.textureLoader.load(source.path, file => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === "cubeTexture") {
        this.loaders.cubeTextureLoader.load(source.path, file => {
          this.sourceLoaded(source, file);
        });
      }
    }
  }

  /**
   * 保存属性中的加载资源,更新 items loaded 属性并测试加载是否完成
   * 如果加载了所有源，我们将触发一个 ready 事件
   * @param {*} source
   * @param {*} file
   */
  sourceLoaded(source: Source, file) {
    this.items[source.name] = file;

    this.loaded++;

    if (this.loaded === this.toLoad) {
      this.trigger("ready");
    }
  }
}
