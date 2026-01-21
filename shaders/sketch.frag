#version 330 core

in VS_OUT {
    vec3 vPosWS;
    vec3 vNormalWS;
    vec3 vPosVS;
    vec2 uv;
} fs_in;

out vec4 FragColor;

uniform vec4 lPos;        // LIGHT POSITION
uniform sampler2D tex;    // TEXTURE UNIT 0

uniform vec3  uPaperColor = vec3(0.95);
uniform vec3  uInkColor   = vec3(0.08);

uniform float uLineScale  = 90.0;   // densidade das linhas
uniform float uLineWidth  = 0.11;   // espessura relativa
uniform float uJitter     = 0.035;  // imperfeicao
uniform float uContrast   = 1.25;   // contraste do sombreamento
uniform float uPaperMix   = 0.20;   // quanto o tex entra como “papel”
uniform float uPaperGrain = 0.10;   // grão adicional procedural

uniform float uT1 = 0.15;  // start hatch 1
uniform float uT2 = 0.30;  // start hatch 2
uniform float uT3 = 0.45;  // start hatch 3
uniform float uT4 = 0.60;  // start hatch 4

uniform float uTW = 0.20;  // transition width

uniform float uLightLODMinDist = 1.5;   // perto da luz
uniform float uLightLODMaxDist = 18.0;  // longe da luz
uniform float uLightLODMin     = 0.35;  // limite inferior do fator (longe)
uniform float uLightLODMax     = 1.00;  // limite superior do fator (perto)

uniform float uGrainScale = 400.0; // controla tamanho do grain no UV

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

void main()
{
    vec3 Nws = normalize(fs_in.vNormalWS);
    vec3 Lws = normalize(lPos.xyz - fs_in.vPosWS); 

    float ndl = max(dot(Nws, Lws), 0.0);

    float shade = pow(1.0 - ndl, uContrast);
    shade = quantize(shade, 6.0);

    // padrao em camera space (view-space)
    vec2 p = fs_in.vPosVS.xy;

    // --- LOD por distancia à luz ---
    float distToLight = length(lPos.xyz - fs_in.vPosWS);

    // fator: 1 perto (minDist), 0 longe (maxDist)
    float t = 1.0 - smoothstep(uLightLODMinDist, uLightLODMaxDist, distToLight);

    // converte para lod no intervalo [uLightLODMin, uLightLODMax]
    float lod = mix(uLightLODMin, uLightLODMax, t);

    // aplica ao padrao: longe -> menos densidade, perto -> mais densidade
    float lineScale = uLineScale * lod;

    // aplica à espessura: perto -> mais grosso/escuro; longe -> mais fino/leve
    float lineWidth = mix(uLineWidth * 0.6, uLineWidth * 1.4, t);



    // Papel via textura (opcional): assume que tex e um ruido/papel
    vec3 paperTex = texture(tex, fs_in.uv).rgb;
    float paperLuma = dot(paperTex, vec3(0.299, 0.587, 0.114));

    vec2 g = fs_in.uv * uGrainScale;
    float grain = (noise2(g) - 0.5) * uPaperGrain;

    // Cross-hatching (4 direcoes)
    float h1 = hatchMask(p, radians(20.0),  lineScale * 1.00, lineWidth, uJitter);
    float h2 = hatchMask(p, radians(65.0),  lineScale * 0.95, lineWidth, uJitter);
    float h3 = hatchMask(p, radians(110.0), lineScale * 0.90, lineWidth, uJitter);
    float h4 = hatchMask(p, radians(155.0), lineScale * 0.85, lineWidth, uJitter);

    float w1 = smoothstep(uT1, uT1 + uTW, shade);
    float w2 = smoothstep(uT2, uT2 + uTW, shade);
    float w3 = smoothstep(uT3, uT3 + uTW, shade);
    float w4 = smoothstep(uT4, uT4 + uTW, shade);


    float inkAmount = h1 * w1 + h2 * w2 + h3 * w3 + h4 * w4;
    inkAmount = clamp(inkAmount, 0.0, 1.0);

    // Base de papel: cor + grão procedural + mistura do tex (como luma)
    vec3 basePaper = uPaperColor + grain;
    basePaper = mix(basePaper, basePaper * (0.75 + 0.5 * paperLuma), uPaperMix);

    // Mistura final: “tinta” nas zonas onde a hachura aparece
    vec3 col = mix(basePaper, uInkColor, inkAmount);

    FragColor = vec4(col, 1.0);
}
