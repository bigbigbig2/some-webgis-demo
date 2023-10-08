import EventEmitter from "./EventEmitter.ts";

export default class Sizes extends EventEmitter {
  width: number;
  height: number;
  pixelRatio: number;

  constructor() {
    super();

    // 初始化窗口尺寸和设备像素比
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);

    // 监听浏览器窗口的尺寸变化事件
    window.addEventListener("resize", () => {
      // 更新窗口尺寸和设备像素比
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio = Math.min(window.devicePixelRatio, 2);

      // 触发resize事件
      this.trigger("resize");
    });
  }
}
