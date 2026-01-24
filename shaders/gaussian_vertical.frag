#version 460

in vec2 tc;
layout (location = 0) out vec4 blurImageY;

uniform sampler2D inCol;
uniform vec2 uResolution;
uniform float sigma = 2.0; // controls blurring strength!
uniform int blurRadius = 4;

float gauss(float x, float s) {
    //return exp(-0.5 * (x * x) / (s * s));
    float t = x / s;
    float u = 1.0 - t * t;
    return (u <= 0.0) ? 0.0 : (u * u); // quartic
}

void main() {
    vec2 invRes = 1.0 / uResolution;
    vec2 dy = vec2(0.0, invRes.y);

    float wSum = 0.0;
    vec3 sumC = vec3(0.0);

    for (int i = -blurRadius; i <= blurRadius; i++) {
        float w = gauss(float(i), sigma);
        vec3 c = texture(inCol, tc + i*dy).rgb;
        sumC += w * c;
        wSum += w;
    }

    blurImageY = vec4(sumC / max(wSum, 1e-8), 1); // DO NOT DIVIDE BY 0!!!!!!!
}