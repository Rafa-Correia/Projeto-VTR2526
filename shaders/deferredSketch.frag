#version 460

in vec2 vUV;
out vec4 FragColor;

// G-buffer textures
uniform sampler2D uPosTex;      // posVS.xyz
uniform sampler2D uNormalTex;   // normal encoded [0..1]
uniform sampler2D uTexCoordTex; // uv.xy
uniform sampler2D uDepthTex;    // depth (opcional p/ edges)

// Paper/noise texture (opcional)
uniform sampler2D tex;          // a tua textura "papel" (ruído)

// Light (usa o MESMO espaço do pos do gbuffer: aqui é VIEW-SPACE)
uniform vec4 lPos;

uniform mat4 V; // view matrix (p/ converter pos do mundo p/ view-space)

// UI / Params (iguais aos teus)
uniform vec3  uPaperColor = vec3(0.95);
uniform vec3  uInkColor   = vec3(0.08);

uniform float uLineScale  = 90.0;
uniform float uLineWidth  = 0.11;
uniform float uJitter     = 0.035;
uniform float uContrast   = 1.25;
uniform float uPaperMix   = 0.20;
uniform float uPaperGrain = 0.10;

uniform float uT1 = 0.15;
uniform float uT2 = 0.30;
uniform float uT3 = 0.45;
uniform float uT4 = 0.60;
uniform float uTW = 0.20;

uniform float uLightLODMinDist = 1.5;
uniform float uLightLODMaxDist = 18.0;
uniform float uLightLODMin     = 0.35;
uniform float uLightLODMax     = 1.00;

uniform float uGrainScale = 400.0;

// Edge detection params (do teu XML)
uniform float uDepthThresh  = 0.02;
uniform float uNormalThresh = 0.25;
uniform float uEdgeOpacity  = 1.0;
uniform vec4  uEdgeColor    = vec4(0.05, 0.05, 0.05, 1.0);

uniform vec2 uResolution; // viewport size (px)

// ---------- noise / hatch helpers (iguais) ----------
float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float lineDist(float x) {
    float fx = fract(x);
    return min(fx, 1.0 - fx);
}

float hatchMask(vec2 p, float angle, float scale, float width, float jitter)
{
    float s = sin(angle), c = cos(angle);
    vec2 r = vec2(c * p.x - s * p.y, s * p.x + c * p.y);

    float j = (noise2(p * 3.5) - 0.5) * jitter;
    float d = lineDist(r.x * scale + j);

    float aa = fwidth(d);
    float w0 = max(width - aa, 0.0);
    float w1 = width + aa;

    float ink = 1.0 - smoothstep(w0, w1, d);
    return clamp(ink, 0.0, 1.0);
}

float quantize(float x, float steps)
{
    return floor(x * steps) / max(steps, 1.0);
}

// ---------- edge helpers ----------
vec3 decodeNormal(vec4 enc)
{
    return normalize(enc.xyz * 2.0 - 1.0);
}

void main()
{
    // --- ler G-buffer ---
    vec3 posVS = texture(uPosTex, vUV).xyz;
    vec3 Nvs   = decodeNormal(texture(uNormalTex, vUV));
    vec2 uvObj = texture(uTexCoordTex, vUV).xy;

    vec3 LposVS = (V * lPos).xyz;

    // --- lighting (em VIEW-SPACE, consistente com posVS e Nvs) ---
    vec3 Lvs = normalize(LposVS - posVS);
    float ndl = max(dot(Nvs, Lvs), 0.0);

    float shade = pow(1.0 - ndl, uContrast);
    shade = quantize(shade, 6.0);

    // padrao em camera space (view-space)
    vec2 p = posVS.xy;

    // --- LOD por distancia à luz (usa posVS + lPos em VS) ---
    float distToLight = length(LposVS - posVS);
    float t = 1.0 - smoothstep(uLightLODMinDist, uLightLODMaxDist, distToLight);
    float lod = mix(uLightLODMin, uLightLODMax, t);

    float lineScale = uLineScale * lod;
    float lineWidth = mix(uLineWidth * 0.6, uLineWidth * 1.4, t);

    // --- papel/grain por UV ---
    vec3 paperTex = texture(tex, uvObj).rgb;
    float paperLuma = dot(paperTex, vec3(0.299, 0.587, 0.114));

    vec2 g = uvObj * uGrainScale;
    float grain = (noise2(g) - 0.5) * uPaperGrain;

    // --- cross-hatching ---
    float h1 = hatchMask(p, radians(20.0),  lineScale * 1.00, lineWidth, uJitter);
    float h2 = hatchMask(p, radians(65.0),  lineScale * 0.95, lineWidth, uJitter);
    float h3 = hatchMask(p, radians(110.0), lineScale * 0.90, lineWidth, uJitter);
    float h4 = hatchMask(p, radians(155.0), lineScale * 0.85, lineWidth, uJitter);

    float w1 = smoothstep(uT1, uT1 + uTW, shade);
    float w2 = smoothstep(uT2, uT2 + uTW, shade);
    float w3 = smoothstep(uT3, uT3 + uTW, shade);
    float w4 = smoothstep(uT4, uT4 + uTW, shade);

    float inkAmount = clamp(h1*w1 + h2*w2 + h3*w3 + h4*w4, 0.0, 1.0);

    vec3 basePaper = uPaperColor + grain;
    basePaper = mix(basePaper, basePaper * (0.75 + 0.5 * paperLuma), uPaperMix);

    vec3 col = mix(basePaper, uInkColor, inkAmount);

    /* // --- edges (dobras + depth) ---
    float ne = normalEdge(vUV);
    float de = depthEdge(vUV);

    float edgeN = smoothstep(uNormalThresh, uNormalThresh * 1.5, ne);
    float edgeD = smoothstep(uDepthThresh,  uDepthThresh  * 1.5, de);

    float edge = clamp(max(edgeN, edgeD) * uEdgeOpacity, 0.0, 1.0);

    col = mix(col, uEdgeColor.rgb, edge); */

    FragColor = vec4(col, 1.0);
}
