#version 460

uniform sampler2D albedo;
uniform sampler2D pos;
uniform sampler2D normal;
uniform sampler2D texCoord;

uniform float lightCoef = 0.5;
uniform float diffuseCoef = 1.0;
uniform vec4 lightColor = vec4(1.0, 0.7, 0.3, 1.0);

uniform float shininess = 512;
uniform vec4 specular_color = vec4(1);

in vec3 aLDir;
in vec2 tc;

layout (location = 0) out vec4 base_img_out;

void main() {
    vec4 aPos = texture(pos, tc);
    if(aPos.w == 0)
        discard;
    
    vec3 aNormal =normalize(texture(normal, tc).xyz * 2 - 1);
    vec3 L = normalize(aLDir);
    vec2 texCoords = texture(texCoord, tc).xy;
    //float depth_raw = texture(depth, tc).x;

    float luminance = max(0.0, diffuseCoef * dot(aNormal, aLDir));
    //float ambientLuminance = 0.01;


    vec3 eye = -normalize(aPos.xyz);

    vec3 half_vec = normalize(eye + aLDir);

    float specular_component = max(0.0, dot(aNormal, half_vec));
    specular_component = pow(specular_component, shininess);

    vec3 obj_albedo = texture(albedo, texCoords).rgb;

    vec3 col = obj_albedo * luminance + luminance * lightColor.xyz * lightCoef + specular_component * specular_color.rgb;
    //vec3 outCol = mix(col, edgeColor.rgb, edgeMask * uEdgeOpacity);

    base_img_out = vec4(col, 1.0);
}