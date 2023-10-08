precision mediump float;

uniform sampler2D u_screen;//需要绘制到屏幕上的纹理
uniform float u_opacity;//控制纹理不透明度的值

varying vec2 v_tex_pos;//从顶点着色器传递过来的纹理坐标

void main() {
    vec4 color = texture2D(u_screen, 1.0 - v_tex_pos);//反转了纹理坐标，纹理会被上下颠倒地绘制。
    //调整读取的颜色的不透明度。这里使用了一个小技巧：首先将颜色值乘以不透明度和255.，然后取整，最后再除以255.。这确保了即使u_opacity接近1.，颜色值也会完全透明。
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);
}
