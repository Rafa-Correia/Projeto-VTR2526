#version 460

uniform sampler2D albedo;
uniform sampler2D pos;
uniform sampler2D normal;
uniform sampler2D texCoord;

uniform float threshold = 0.5;
uniform float lightCoef = 0.5;
uniform float diffuseCoef = 1.0;
uniform vec4 lightColor = vec4(1.0, 0.7, 0.3, 1.0);

in vec3 aLDir;
in vec2 tc;

layout (location = 0) out vec4 base_img_out;

void main() {
    vec4 aPos = texture(pos, tc);
    if(aPos.w == 0)
        discard;
    
    vec3 aNormal = texture(normal, tc).xyz;
    vec2 texCoords = texture(texCoord, tc).xy;
    //float depth_raw = texture(depth, tc).x;

    float luminance = max(0.0, diffuseCoef * dot(aNormal, normalize(aLDir)));
    //float ambientLuminance = 0.01;
    
    float is_illuminated = 1.0;

    //quantize luminance
    if (luminance == 0) {
        luminance = 0.15;
        is_illuminated = 0.0;
    }
    else if (luminance > threshold)
        luminance = 1.0;
    else if (luminance > threshold - (1 - threshold) * 0.05)
        luminance = 0.65;
    else 
        luminance = 0.15;

    vec3 obj_albedo = texture(albedo, texCoords).rgb;

    vec3 col = obj_albedo * luminance + luminance * lightColor.xyz * lightCoef * is_illuminated;
    //vec3 outCol = mix(col, edgeColor.rgb, edgeMask * uEdgeOpacity);

    base_img_out = vec4(col, 1.0);
}