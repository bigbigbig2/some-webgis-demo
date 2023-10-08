precision mediump float;

attribute vec2 a_pos;

varying vec2 v_tex_pos;//传递给片段着色器的纹理坐标

void main() {
    v_tex_pos = a_pos;//将输入的顶点位置a_pos直接传递给片段着色器作为纹理坐标v_tex_pos。
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);//将输入的[0,1]范围的坐标转换为[-1,1]范围的坐标。
}
