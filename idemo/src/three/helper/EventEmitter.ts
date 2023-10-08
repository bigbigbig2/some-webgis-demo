/* eslint-disable @typescript-eslint/ban-types */
/**
 * 自定义事件触发器，这种模式允许你创建一个对象，该对象可以发出事件，并允许其他对象或函数监听这些事件。
 */

interface ICallbackMap {
  [namespace: string]: {
    [value: string]: Function[];
  };
}

interface IName {
  original: string;
  value: string;
  namespace: string;
}

export default class EventEmitter {
  private callbacks: ICallbackMap = {
    base: {}
  };

  constructor() {
    this.callbacks = {};
    this.callbacks.base = {};
  }

  /**
   *用于添加事件监听器
   * @param _names  事件名
   * @param callback 回调
   * @returns
   */
  on(_names: string, callback: Function): this {
    if (!_names || _names === "") {
      console.warn("wrong names");
      return this;
    }

    if (!callback) {
      console.warn("wrong callback");
      return this;
    }

    const names = this.resolveNames(_names);

    names.forEach(_name => {
      const name = this.resolveName(_name);

      if (!this.callbacks[name.namespace]) this.callbacks[name.namespace] = {};
      if (!this.callbacks[name.namespace][name.value])
        this.callbacks[name.namespace][name.value] = [];

      this.callbacks[name.namespace][name.value].push(callback);
    });

    return this;
  }

  /**
   *移除事件监听器
   * @param _names
   * @returns
   */
  off(_names: string): this {
    if (!_names || _names === "") {
      console.warn("wrong name");
      return this;
    }

    const names = this.resolveNames(_names);

    names.forEach(_name => {
      const name = this.resolveName(_name);

      if (name.namespace !== "base" && name.value === "") {
        delete this.callbacks[name.namespace];
      } else {
        if (name.namespace === "base") {
          for (const namespace in this.callbacks) {
            if (this.callbacks[namespace][name.value]) {
              delete this.callbacks[namespace][name.value];

              if (Object.keys(this.callbacks[namespace]).length === 0)
                delete this.callbacks[namespace];
            }
          }
        } else if (this.callbacks[name.namespace][name.value]) {
          delete this.callbacks[name.namespace][name.value];

          if (Object.keys(this.callbacks[name.namespace]).length === 0)
            delete this.callbacks[name.namespace];
        }
      }
    });

    return this;
  }

  /**
   *触发某个事件
   * @param _name 触发某个事件
   * @param _args
   * @returns
   */
  trigger(_name: string, _args = []) {
    if (!_name || _name === "") {
      console.warn("wrong name");
      return false;
    }

    let finalResult;

    const name = this.resolveName(this.resolveNames(_name)[0]);

    if (name.namespace === "base") {
      for (const namespace in this.callbacks) {
        if (this.callbacks[namespace][name.value]) {
          this.callbacks[namespace][name.value].forEach(callback => {
            const result = callback(..._args);
            if (typeof finalResult === "undefined") finalResult = result;
          });
        }
      }
    } else if (this.callbacks[name.namespace]) {
      if (name.value === "") {
        console.warn("wrong name");
        return this;
      }

      this.callbacks[name.namespace][name.value].forEach(callback => {
        const result = callback(..._args);
        if (typeof finalResult === "undefined") finalResult = result;
      });
    }

    return finalResult;
  }

  /**
   * 解析事件名
   * @param names
   * @returns
   */
  private resolveNames(names: string): string[] {
    return names
      .replace(/[^a-zA-Z0-9 ,/.]/g, "")
      .replace(/[,/]+/g, " ")
      .split(" ");
  }

  private resolveName(name: string): IName {
    const parts = name.split(".");
    return {
      original: name,
      value: parts[0],
      namespace: parts[1] || "base"
    };
  }
}
