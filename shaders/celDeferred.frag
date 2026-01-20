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

out vec4 aCol;

void main() {
    vec4 aPos = texture(pos, tc);
    vec3 aNormal = texture(normal, tc).xyz * 2 - 1;
    vec2 texCoords = texture(texCoord, tc).xy;

    if(aPos.w == 0)
        discard;

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

    aCol = vec4(obj_albedo * luminance + luminance * lightColor.xyz * lightCoef * is_illuminated, 1.0);
}