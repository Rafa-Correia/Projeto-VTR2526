#version 460

in vec2 vUV;
layout (location = 0) out vec4 sketch_color;

// G-buffer textures
uniform sampler2D uPosTex;      // RGBA: XYZ = position WS
uniform sampler2D uNormalTex;   // RGBA: XYZ = normal encoded
uniform sampler2D uTexCoordTex; // RGBA: XY = UV

// Paper/noise texture
//uniform sampler2D tex;

// Light (WORLD SPACE)
uniform vec4 lPos;

// UI / Params
uniform vec3  uPaperColor = vec3(0.95);
uniform vec3  uInkColor   = vec3(0.01);

uniform float uLineScale;
uniform float uLineWidth;
uniform float uJitter;
uniform float uContrast;
uniform float uPaperGrain;

uniform float uT1;
uniform float uT2;
uniform float uT3;
uniform float uT4;
uniform float uTW;

uniform float R1;
uniform float R2;
uniform float R3;
uniform float R4;

uniform float uSpacingJitter;

uniform float uLightLODMinDist = 1.5;
uniform float uLightLODMaxDist = 18.0;
uniform float uLightLODMin     = 0.35;
uniform float uLightLODMax     = 1.00;

uniform float uGrainScale = 400.0;

// ---------- noise / hatch helpers ----------
// hash 2D para noise
float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

// função de noise
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

// hash 1D para offsets de linha
float hash11(float x)
{
    return fract(sin(x * 127.1) * 43758.5453123);
}

float hatchMask(vec2 p, float angle, float scale, float width, float jitter)
{
    float s = sin(angle), c = cos(angle);
    vec2 r = vec2(c * p.x - s * p.y, s * p.x + c * p.y);

    float dr = max(abs(dFdx(r.x)), abs(dFdy(r.x)));
    // se dr*scale > 1, estás a atravessar várias linhas por pixel -> aliasing
    float maxScale = 0.5 / max(dr, 1e-6);   // 0.5 = margem conservadora
    float sClamped = min(scale, maxScale);

    float x = r.x * sClamped;

    // índice da linha/banda
    float id = floor(x);

    // offset aleatório por linha
    float j = (hash11(id + 13.37) - 0.5) * uSpacingJitter;

    float d = lineDist(x + j);

    float aa = fwidth(d);
    float w0 = max(width - aa, 0.0);
    float w1 = width + aa;

    float ink = 1.0 - smoothstep(w0, w1, d);
    return clamp(ink, 0.0, 1.0);
}


/* float quantize(float x, float steps)
{
    return floor(x * steps) / max(steps, 1.0);
} */

vec3 decodeNormal(vec4 enc)
{
    return normalize(enc.xyz * 2.0 - 1.0);
}

vec3 triWeights(vec3 n)
{
    // pesos por alinhamento com eixos (mais alinhado = maior peso)
    vec3 a = abs(n);
    // opcional: afinar o "sharpness" (>=1). 4 dá transições mais limpas
    a = pow(a, vec3(4.0));
    return a / max(a.x + a.y + a.z, 1e-6);
}

void main()
{
    vec4 aPos = texture(uPosTex, vUV);
    if (aPos.w == 0.0)
        discard;

    // --- ler G-buffer (WORLD SPACE) ---
    vec3 posWS = aPos.xyz;
    vec3 Nws = decodeNormal(texture(uNormalTex, vUV));
    Nws = normalize(Nws);
    vec2 uvObj = texture(uTexCoordTex, vUV).xy;

    // --- luz em WORLD SPACE ---
    vec3 LposWS = lPos.xyz;
    vec3 Lws    = normalize(LposWS - posWS);
    float ndl   = max(dot(Nws, Lws), 0.0);

    // --- shading para definir suavidade de hatching ---
    float shade = pow(1.0 - ndl, uContrast);
    //shade = quantize(shade, 6.0);

    // --- LOD por distância à luz (WORLD SPACE) ---
    float distToLight = length(LposWS - posWS);
    float t = 1.0 - smoothstep(uLightLODMinDist, uLightLODMaxDist, distToLight); // 0 = longe, 1 = perto, t = fator de proximidade à luz
    float lod = mix(uLightLODMin, uLightLODMax, t); 

    // Densidade da linha varia com o LOD
    float lineScale = uLineScale * lod;

    // Largura da linha varia com a distância à luz
    float lineWidth = mix(uLineWidth * 0.5, uLineWidth * 2, t);

    // --- papel/grain por UV  ---
    //vec3 paperTex = texture(tex, uvObj).rgb;
    //float paperLuma = dot(paperTex, vec3(0.299, 0.587, 0.114));

    vec2 g = uvObj * uGrainScale;
    float grain = (noise2(g) - 0.5) * uPaperGrain;

    // --- cross-hatching ---
    vec3 w = triWeights(Nws);

    // Coordenadas por projeção:
    vec2 pX = posWS.yz + vec2(17.0, 31.0);
    vec2 pY = posWS.xz + vec2(47.0, 11.0);
    vec2 pZ = posWS.xy + vec2(23.0, 59.0);

    // Calcula as 4 camadas de hatch por eixo
    float h1X = hatchMask(pX, radians(R1),  lineScale * 1.00, lineWidth, uJitter);
    float h2X = hatchMask(pX, radians(R2),  lineScale * 0.95, lineWidth * 2, uJitter);
    float h3X = hatchMask(pX, radians(R3), lineScale * 0.90, lineWidth * 3, uJitter);
    float h4X = hatchMask(pX, radians(R4), lineScale * 0.85, lineWidth * 4, uJitter);

    float h1Y = hatchMask(pY, radians(R1),  lineScale * 1.00, lineWidth, uJitter);
    float h2Y = hatchMask(pY, radians(R2),  lineScale * 0.95, lineWidth * 2, uJitter);
    float h3Y = hatchMask(pY, radians(R3), lineScale * 0.90, lineWidth * 3, uJitter);
    float h4Y = hatchMask(pY, radians(R4), lineScale * 0.85, lineWidth * 4, uJitter);

    float h1Z = hatchMask(pZ, radians(R1),  lineScale * 1.00, lineWidth, uJitter);
    float h2Z = hatchMask(pZ, radians(R2),  lineScale * 0.95, lineWidth * 2, uJitter);
    float h3Z = hatchMask(pZ, radians(R3), lineScale * 0.90, lineWidth * 3, uJitter);
    float h4Z = hatchMask(pZ, radians(R4), lineScale * 0.85, lineWidth * 4, uJitter);

    // Misturar os eixos pelos pesos
    float h1 = h1X * w.x + h1Y * w.y + h1Z * w.z;
    float h2 = h2X * w.x + h2Y * w.y + h2Z * w.z;
    float h3 = h3X * w.x + h3Y * w.y + h3Z * w.z;
    float h4 = h4X * w.x + h4Y * w.y + h4Z * w.z;

    // Pesos por thresholds
    float w1 = smoothstep(uT1, uT1 + uTW, shade);
    float w2 = smoothstep(uT2, uT2 + uTW, shade);
    float w3 = smoothstep(uT3, uT3 + uTW, shade);
    float w4 = smoothstep(uT4, uT4 + uTW, shade);

    float inkAmount = clamp(h1*w1 + h2*w2 + h3*w3 + h4*w4, 0.0, 1.0);

    vec3 basePaper = uPaperColor + grain;

    float lightT = smoothstep(0.4, 0.95, ndl); // thresholds
    float inkFade = mix(1.0, 0.5, lightT);     // na luz reduz para 50%

    float inkAmountLit = inkAmount * inkFade;

    vec3 col = mix(basePaper, uInkColor, inkAmountLit);
    //vec3 col = uInkColor;
    sketch_color = vec4(col, 1.0);
}
