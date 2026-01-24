#version 460

in vec2 tc;
layout (location = 0)  out vec4 outCol;

uniform sampler2D inCol;
uniform sampler2D inTensor; //blurred tensor

uniform vec2 uResolution;

// filter parameters
uniform int radius = 5;
uniform float radSigma = 0.55;
uniform float secSharp = 6.0;
uniform float anisotropyStrength = 0.75; //controls how much the kernel is streched along edges
uniform float variancePow = 6.0; //controls how kernel sections are blended together


float luminance(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

#ifndef PI
#define PI 3.14159265358979323846
#endif

float sectorWeight(float theta, float theta_k, float sharpness) {
    float d = theta - theta_k;
    d = atan(sin(d), cos(d));

    float w = max(0.0, cos(d));
    return pow(w, sharpness);
}

void main () {
    vec4 cur = texture(inCol, tc);
    if(cur.a == 0.0) 
        discard;

    vec2 invRes = 1.0 / uResolution;
    vec2 dx = vec2(invRes.x, 0.0);
    vec2 dy = vec2(0.0, invRes.y);

    vec3 tensorCol = texture(inTensor, tc).rgb;
    float Jxx = tensorCol.r;
    float Jxy = tensorCol.g;
    float Jyy = tensorCol.b;

    float lambda1, lambda2;
    vec2 nDir;

    float tr = Jxx + Jyy;
    float det = Jxx * Jyy - Jxy * Jxy;
    float disc = max(0.0, tr * tr - 4.0 * det);
    float s = sqrt(disc);

    float l1 = 0.5 * (tr + s);
    float l2 = 0.5 * (tr - s);

    nDir = vec2(0.0);

    // If b is small, fall back to axis-aligned
    if (abs(Jxy) > 1e-10) {
        nDir = normalize(vec2(l1 - Jyy, Jxy));
    } else {
        nDir = (Jxx >= Jyy) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    }

    vec2 tDir = vec2(-nDir.y, nDir.x);

    float anisotropy = (l1 - l2) / (l1 + l2 + 1e-6);
    anisotropy = clamp(anisotropy, 0.0, 1.0);

    float r = float(radius);
    float elong = 1.0 + anisotropy * anisotropyStrength * 2.0;
    float rt = r * elong;
    float rn = r / elong;

    rt = max(rt, 1.0);
    rn = max(rn, 1.0);

    int rMax = int(ceil(max(rt, rn)));

    const int K = 8; // how many sectors in kernel. normaly 8

    vec3 sumC[K];
    float sumW[K];
    float sumL[K];
    float sumL2[K];

    for(int k = 0; k < K; k++) {
        sumC[k]  = vec3(0.0);
        sumW[k]  = 0.0;
        sumL[k]  = 0.0;
        sumL2[k] = 0.0;
    }

    for(int iy = -rMax; iy <= rMax; iy++) {
        for(int ix = -rMax; ix <= rMax; ix++) {
            vec2 offsetPixel = vec2(float(ix), float(iy));
            vec2 offsetUV = ix * dx + iy * dy;

            vec4 value = texture(inCol, tc + offsetUV);
            if (value.a == 0.0) 
                continue;

            float xn = dot(offsetPixel, nDir);
            float xt = dot(offsetPixel, tDir);

            float un = xn / rn;
            float ut = xt / rt;
            float e2 = un * un + ut * ut;

            if (e2 >= 1.0)
                continue; //outside of ellipse

            float wRad = exp(-0.5 * e2 / max(radSigma * radSigma, 1e-6)); //just dont divide by 0 man
            float theta = atan(ut, un);
            
            float lum = luminance(value.rgb);
            for (int k = 0; k < K; k++) {
                float theta_K = (2.0 * PI) * (float(k) / float(K));
                float wSec = sectorWeight(theta, theta_K, secSharp);

                float w = wRad * wSec;
                if (w <= 1e-8)
                    continue;

                sumC[k]  += w * value.rgb;
                sumL[k]  += w * lum;
                sumL2[k] += w * lum * lum;
                sumW[k]  += w;
            }
        }
    }

    vec3 outRGB = vec3(0.0);
    float outW = 0.0;

    for(int k = 0; k < K; k++) {
        if (sumW[k] <= 1e-6)
            continue;
        
        vec3 meanC = sumC[k] / sumW[k];
        float meanL = sumL[k] / sumW[k];
        float meanL2 = sumL2[k] / sumW[k];
        float var = max(0.0, meanL2 - meanL * meanL);
        float wk = pow(max(var, 1e-6), -variancePow);

        outRGB += wk * meanC;
        outW += wk;
    }

    if (outW <= 1e-8)
        outCol = cur; //ensure no err
    else
        outCol = vec4(outRGB / outW, 1.0);
}