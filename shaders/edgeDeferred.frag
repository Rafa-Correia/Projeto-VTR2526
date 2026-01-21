#version 460

uniform sampler2D depth;
uniform sampler2D normal;
uniform sampler2D baseImg;

uniform float uDepthThresh = 0.8;
uniform float uNormalThresh = 0.2;
uniform float uEdgeOpacity = 1.0;
uniform vec4 edgeColor = vec4(0.1, 0.1, 0.1, 1.0);

uniform vec2  uResolution = vec2(1920, 1080);
uniform float uNear = 1.0;
uniform float uFar = 1000.0;

in vec2 tc;

out vec4 aCol;


vec3 decodeNormal(vec3 enc) {
    return normalize(enc * 2.0 - 1.0);
}

float linearizeDepth(float z01, float nearZ, float farZ) {
    float zNDC = z01 * 2.0 - 1.0;
    return (2.0 * nearZ * farZ) / (farZ + nearZ - zNDC * (farZ - nearZ));
}


float sampleLinDepth(vec2 uv) {
    float z = texture(depth, uv).r;
    return linearizeDepth(z, uNear, uFar);
}

vec3 sampleNormal(vec2 uv) {
    return decodeNormal(texture(normal, uv).rgb);
}



void main() {
    vec2 uInvResolution = vec2(1 / uResolution.x, 1.0 / uResolution.y);

    vec2 dx = vec2(uInvResolution.x, 0.0);
    vec2 dy = vec2(0.0, uInvResolution.y);


    float d  = sampleLinDepth(tc);
    vec3  n  = sampleNormal(tc);

    float dR = sampleLinDepth(tc + dx);
    float dL = sampleLinDepth(tc - dx);
    float dU = sampleLinDepth(tc + dy);
    float dD = sampleLinDepth(tc - dy);

    vec3 nR = sampleNormal(tc + dx);
    vec3 nL = sampleNormal(tc - dx);
    vec3 nU = sampleNormal(tc + dy);
    vec3 nD = sampleNormal(tc - dy);


    float depthDiff = max(max(abs(d - dR), abs(d - dL)),
                          max(abs(d - dU), abs(d - dD)));

    float depthScale = 1.0 / max(d, 1e-3);
    float depthMetric = depthDiff * depthScale;

    float normalDiff = max(max(1.0 - dot(n, nR), 1.0 - dot(n, nL)),
                           max(1.0 - dot(n, nU), 1.0 - dot(n, nD)));


    float depthEdge  = smoothstep(uDepthThresh,  uDepthThresh * 2.0,  depthMetric);
    float normalEdge = smoothstep(uNormalThresh, uNormalThresh * 2.0, normalDiff);

    float edgeMask = clamp(max(depthEdge, normalEdge), 0.0, 1.0);

    vec2 dx2 = 2.0 * dx;
    vec2 dy2 = 2.0 * dy;

    float dR2 = sampleLinDepth(tc + dx2);
    float dL2 = sampleLinDepth(tc - dx2);
    float dU2 = sampleLinDepth(tc + dy2);
    float dD2 = sampleLinDepth(tc - dy2);

    vec3 nR2 = sampleNormal(tc + dx2);
    vec3 nL2 = sampleNormal(tc - dx2);
    vec3 nU2 = sampleNormal(tc + dy2);
    vec3 nD2 = sampleNormal(tc - dy2);

    float depthDiff2 = max(max(abs(d - dR2), abs(d - dL2)),
                           max(abs(d - dU2), abs(d - dD2)));
    float depthMetric2 = depthDiff2 * depthScale;

    float normalDiff2 = max(max(1.0 - dot(n, nR2), 1.0 - dot(n, nL2)),
                            max(1.0 - dot(n, nU2), 1.0 - dot(n, nD2)));

    float edge2 = max(
        smoothstep(uDepthThresh,  uDepthThresh * 2.0,  depthMetric2),
        smoothstep(uNormalThresh, uNormalThresh * 2.0, normalDiff2)
    );

    edgeMask = max(edgeMask, edge2);

    vec3 base = texture(baseImg, tc).rgb;
    vec3 outCol = mix(base, edgeColor.rgb, edgeMask * uEdgeOpacity);

    aCol = vec4(outCol, 1.0);
}