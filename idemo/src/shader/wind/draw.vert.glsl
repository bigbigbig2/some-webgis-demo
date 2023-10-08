precision mediump float;

attribute float a_index; //每个粒子的索引

uniform sampler2D u_particles;//粒子纹理单元变量,其中每个像素代表一个粒子的位置
uniform float u_particles_res;//纹理的分辨率，用于从纹理中正确地读取粒子位置

varying vec2 v_particle_pos;//传递给片段着色器的粒子位置

const vec2 bitEnc=vec2(1.,255.);
const vec2 bitDec=1./bitEnc;
// decode particle position from pixel RGBA
vec2 fromRGBA(const vec4 color){
  vec4 rounded_color=floor(color*255.+.5)/255.;
  float x=dot(rounded_color.rg,bitDec);
  float y=dot(rounded_color.ba,bitDec);
  return vec2(x,y);
}


void main() {
    //使用a_index从u_particles纹理中读取粒子的位置。并将这个位置信息编码为RGBA格式，其中R和B代表x位置，G和A代表y位置。
    vec4 color = texture2D(u_particles, vec2(
        fract(a_index / u_particles_res),
        floor(a_index / u_particles_res) / u_particles_res));

    // 从rgba灰度值解码成坐标
    // decode current particle position from the pixel's RGBA value
    // v_particle_pos=vec2(
    //   color.r/255.+color.b,
    //   color.g/255.+color.a
    // );
    v_particle_pos=fromRGBA(color);

    gl_PointSize = 1.0;
    //计算粒子的屏幕位置并设置gl_Position。
    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);
}
