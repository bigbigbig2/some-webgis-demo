import EventEmitter from "./EventEmitter.js";

export default class Time extends EventEmitter {
  private start: number; //被实例化时的时间
  private current: number; //用于存储当前时间
  elapsed: number; //类被实例化以来经过的时间
  delta: number; //表示两次帧刷新之间的时间差

  constructor() {
    super();

    this.start = Date.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16;

    // 使用requestAnimationFrame启动tick方法
    window.requestAnimationFrame(() => {
      this.tick();
    });
  }

  private tick(): void {
    const currentTime = Date.now();
    // 计算时间差
    this.delta = currentTime - this.current;
    this.current = currentTime;
    this.elapsed = this.current - this.start;

    // 触发tick事件
    this.trigger("tick");

    // 使用requestAnimationFrame继续下一个帧的循环
    window.requestAnimationFrame(() => {
      this.tick();
    });
  }
}
