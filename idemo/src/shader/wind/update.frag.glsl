precision highp float;

uniform sampler2D u_particles; //当前粒子的状态纹理
uniform sampler2D u_wind;//风速数据纹理
uniform vec2 u_wind_res;//风速数据纹理的分辨率
uniform vec2 u_wind_min; //风速数据的最小和最大值
uniform vec2 u_wind_max;
uniform float u_rand_seed; //用于随机数生成的种子
uniform float u_speed_factor; //控制粒子速度的因子
uniform float u_drop_rate; //控制粒子重置位置的概率
uniform float u_drop_rate_bump;

varying vec2 v_tex_pos; //从顶点着色器传递过来的纹理坐标

const vec2 bitEnc=vec2(1.,255.);
const vec2 bitDec=1./bitEnc;

// decode particle position from pixel RGBA
vec2 fromRGBA(const vec4 color){
  vec4 rounded_color=floor(color*255.+.5)/255.;
  float x=dot(rounded_color.rg,bitDec);
  float y=dot(rounded_color.ba,bitDec);
  return vec2(x,y);
}

// encode particle position to pixel RGBA
vec4 toRGBA(const vec2 pos){
  vec2 rg=bitEnc*pos.x;
  rg=fract(rg);
  rg-=rg.yy*vec2(1./255.,0.);

  vec2 ba=bitEnc*pos.y;
  ba=fract(ba);
  ba-=ba.yy*vec2(1./255.,0.);

  return vec4(rg,ba);
}


// pseudo-random generator
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
float rand(const vec2 co) {
    float t = dot(rand_constants.xy, co);
    return fract(sin(t) * (rand_constants.z + t));
}

// wind speed lookup; use manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
vec2 lookup_wind(const vec2 uv) {
    // return texture2D(u_wind, uv).rg; // lower-res hardware filtering
    vec2 px = 1.0 / u_wind_res;
    vec2 vc = (floor(uv * u_wind_res)) * px;
    vec2 f = fract(uv * u_wind_res);
    vec2 tl = texture2D(u_wind, vc).rg;
    vec2 tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;
    vec2 br = texture2D(u_wind, vc + px).rg;
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}

void main() {
    vec4 color = texture2D(u_particles, v_tex_pos);

    vec2 pos=fromRGBA(color);
    // vec2 pos = vec2(
    //     color.r / 255.0 + color.b,
    //     color.g / 255.0 + color.a); // decode particle position from pixel RGBA

    vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(pos));
    float speed_t = length(velocity) / length(u_wind_max);

    // take EPSG:4236 distortion into account for calculating where the particle moved
    float distortion=1.;//cos(radians(pos.y * 180.0 - 90.0));
    // float distortion = cos(radians(pos.y * 180.0 - 90.0));
    vec2 offset=vec2(velocity.x/distortion,-velocity.y)*.0001*u_speed_factor;

    // update particle position, wrapping around the date line
    pos = fract(1.0 + pos + offset);

    // a random seed to use for the particle drop
    vec2 seed = (pos + v_tex_pos) * u_rand_seed;

    // drop rate is a chance a particle will restart at random position, to avoid degeneration
    float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;
    float drop = step(1.0 - drop_rate, rand(seed));

    vec2 random_pos = vec2(
        rand(seed + 1.3),
        rand(seed + 2.1));
    pos = mix(pos, random_pos, drop);

    // encode the new particle position back into RGBA
    gl_FragColor=toRGBA(pos);
    // gl_FragColor = vec4(
    //     fract(pos * 255.0),
    //     floor(pos * 255.0) / 255.0);
}
