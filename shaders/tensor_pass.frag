#version 460

in vec2 tc;
layout (location = 0) out vec4 outTensor;

uniform sampler2D inCol;
uniform vec2 uResolution;

float luminance(vec3 c) { 
    return dot(c, vec3(0.299, 0.587, 0.114)); 
}

void main() {
    vec2 invRes = 1.0 / uResolution;
    vec2 dx = vec2(invRes.x, 0.0);
    vec2 dy = vec2(0.0, invRes.y);

    vec4 c0 = texture(inCol, tc);
    if (c0.a <= 0.001) { //discard empty pixels!!!
        outTensor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    float lum_L = luminance(texture(inCol, tc - dx).rgb);
    float lum_R = luminance(texture(inCol, tc + dx).rgb);
    float lum_D = luminance(texture(inCol, tc - dy).rgb);
    float lum_U = luminance(texture(inCol, tc + dy).rgb);

    float gx = 0.5 * (lum_R - lum_L);
    float gy = 0.5 * (lum_U - lum_D);

    float Jxx = gx * gx;
    float Jxy = gx * gy;
    float Jyy = gy * gy;

    outTensor = vec4(Jxx, Jxy, Jyy, 1.0);
}