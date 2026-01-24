#version 460

in vec2 tc;
layout (location = 0) out vec4 outCol;

uniform sampler2D inCol;

uniform vec2  uResolution = vec2(1920, 1080);
uniform int kernel_size = 11; // square side length, so 10 means 10x10 square kernel (on basic filter)

float luminance(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

#define PI 3.1415926538

void main() {
    vec4 cur = texture(inCol, tc);
    if (cur.a == 0.0)
        discard;

    vec2 invRes = 1.0 / uResolution;
    vec2 dx = vec2(invRes.x, 0.0);
    vec2 dy = vec2(0.0, invRes.y);
    
    int halfK = int(floor(float(kernel_size) * 0.5));
    int nSide = halfK + 1; // samples per side inside a quadrant in your current loops

    vec4  colMean[4];
    float varLum[4];

    for (int qv = 0; qv <= 1; ++qv) {
        for (int qh = 0; qh <= 1; ++qh) {
            int q = qv * 2 + qh;

            vec4  colSum  = vec4(0.0);
            float wSum    = 0.0;
            float lumSum  = 0.0;
            float lum2Sum = 0.0;

            for (int i = -halfK + halfK * qv; i <= halfK * qv; ++i) {
                for (int j = -halfK + halfK * qh; j <= halfK * qh; ++j) {
                    vec2 off = float(i) * dy + float(j) * dx;
                    vec4 v = texture(inCol, tc + off);

                    if (v.a <= 0.001)
                        continue;

                    float lum = luminance(v.rgb);

                    colSum  += v;
                    lumSum  += lum;
                    lum2Sum += lum * lum;
                    wSum    += 1.0;
                }
            }

            // if quadrand has no samples, 'eliminate' it (give large variance)
            if (wSum < 1.0) {
                colMean[q] = cur;          // fallback
                varLum[q]  = 1e20;         // huge variance so it won't be chosen
            } else {
                float meanLum = lumSum / wSum;
                float meanLum2 = lum2Sum / wSum;

                varLum[q] = max(0.0, meanLum2 - meanLum * meanLum);

                colMean[q] = colSum / wSum;
            }
        }
    }

    int bestQ = 0;
    float bestVar = varLum[0];
    for (int q = 1; q < 4; ++q) {
        if (varLum[q] < bestVar) {
            bestVar = varLum[q];
            bestQ = q;
        }
    }

    outCol = vec4(colMean[bestQ].rgb, cur.a);
}