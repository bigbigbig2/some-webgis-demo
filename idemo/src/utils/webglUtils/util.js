function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);

  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }

  return shader;
}

export function createProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }

  const wrapper = {program: program};

  //获取当前program中attribute的数量
  const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

  //遍历所有attribute属性，并获取保存其地址到js变量中，然后把这些js变量存储在wrapper对象中。
  for (let i = 0; i < numAttributes; i++) {
    const attribute = gl.getActiveAttrib(program, i);
    wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name);
  }
  const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < numUniforms; i++) {
    const uniform = gl.getActiveUniform(program, i);
    wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name);
  }

  return wrapper;
}

/**
 *创建和初始化 WebGL 纹理的函数
 * @param {*} gl WebGL上下文
 * @param {*} filter 纹理的过滤模式，通常用于指定纹理如何在放大或缩小时进行采样。
 * @param {*} data 要上传到纹理的数据。这可以是一个 Uint8Array（例如，像素数据）或一个图像。
 * @param {*} width 纹理宽度
 * @param {*} height 纹理高度
 * @returns
 */
export function createTexture(gl, filter, data, width, height) {
  //创建纹理对象
  const texture = gl.createTexture();
  //绑定纹理，将新创建的纹理绑定到 TEXTURE_2D 目标，后续的纹理操作将影响这个纹理。
  gl.bindTexture(gl.TEXTURE_2D, texture);
  //设置纹理参数;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //在x（S）轴方向的映射方式，CLAMP_TO_EDGE表示纹理的边缘将被拉伸以填充超出纹理坐标的部分
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //在y（T）轴方向的映射方式
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); //定义了纹理在缩小时的过滤模式。
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter); //定义了纹理在放大时的过滤模式。

  //将纹理数据上传到纹理
  if (data instanceof Uint8Array) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data
    );
  } else {
    //图片纹理
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }
  //解绑纹理，这意味着后续的纹理操作不会影响之前创建的纹理。
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

/**
 * 激活一个指定的纹理单元并绑定一个纹理到这个单元
 * @param {*} gl
 * @param {*} texture 要绑定的 WebGL 纹理对象
 * @param {*} unit 要激活的纹理单元的索引
 */
export function bindTexture(gl, texture, unit) {
  //激活纹理单元
  gl.activeTexture(gl.TEXTURE0 + unit);
  //将指定的纹理对象 texture 绑定到当前激活的纹理单元
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

export function createBuffer(gl, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

/**
 * 在 WebGL 中绑定一个缓冲区到一个顶点属性，并配置如何从缓冲区中解释数据的
 * @param {*} gl
 * @param {*} buffer 要绑定的 WebGL 缓冲区对象
 * @param {*} attribute 顶点属性的位置js变量
 * @param {*} numComponents 顶点分量的个数
 */
export function bindAttribute(gl, buffer, attribute, numComponents) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  //启用指定位置的顶点属性数组。这意味着在后续的渲染调用中，WebGL 将使用这个属性。
  gl.enableVertexAttribArray(attribute);
  //从ARRAY_BUFFER缓冲区中传递数据给attribute属性
  gl.vertexAttribPointer(attribute, numComponents, gl.FLOAT, false, 0, 0);
}

/**
 *在 WebGL 中绑定一个帧缓冲区，并（如果提供了纹理）将纹理附加到该帧缓冲区的颜色附件上
 * @param {*} gl
 * @param {*} framebuffer 要绑定的 WebGL 帧缓冲区对象
 * @param {*} texture  如果提供，这个纹理将被附加到帧缓冲区的颜色缓冲区上
 */
export function bindFramebuffer(gl, framebuffer, texture) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  if (texture) {
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
  }
}
