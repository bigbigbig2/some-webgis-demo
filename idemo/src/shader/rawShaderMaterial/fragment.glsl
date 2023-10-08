precision mediump float;

varying float vRandom;
uniform float uTime;

void main(){
    gl_FragColor = vec4(0.2, vRandom, 0.8, 1.0);
}
