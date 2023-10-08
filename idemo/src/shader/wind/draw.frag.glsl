precision mediump float;

uniform sampler2D u_wind; //风速纹理，其中每个像素的RG值表示风的速度
uniform vec2 u_wind_min; //风速的最小和最大值，用于将纹理值映射到实际速度。
uniform vec2 u_wind_max;
uniform sampler2D u_color_ramp; //颜色渐变纹理，用于根据风速为粒子上色。

varying vec2 v_particle_pos;

void main() {
    //根据粒子位置v_particle_pos从u_wind纹理中读取改粒子的风速
    vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, v_particle_pos).rg);
    //计算风速的大小，并将其映射到[0,1]范围内，得到speed_t
    float speed_t = length(velocity) / length(u_wind_max);

    // color ramp is encoded in a 16x16 texture
    //使用speed_t从u_color_ramp纹理中读取颜色。这个纹理是一个16x16的颜色渐变，所以我们需要进行一些计算来得到正确的纹理坐标
    vec2 ramp_pos = vec2(
        fract(16.0 * speed_t),
        floor(16.0 * speed_t) / 16.0);

    gl_FragColor = texture2D(u_color_ramp, ramp_pos);
}
