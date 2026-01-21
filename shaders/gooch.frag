#version 460

uniform sampler2D albedo;
uniform sampler2D pos;
uniform sampler2D normal;
uniform sampler2D texCoord;

uniform vec4 lightColor = vec4(1.0, 0.7, 0.3, 1.0);

uniform vec3 col1 = vec3(0.1, 0.3, 0.8);
uniform vec3 col2 = vec3(0.8, 0.5, 0.1);

in vec3 aLDir;
in vec2 tc;

layout (location = 0) out vec4 base_img_out;

void main() {
    vec4 aPos = texture(pos, tc);
    if(aPos.w == 0)
        discard;
    
    vec3 aNormal = texture(normal, tc).xyz * 2 - 1;
    vec2 texCoords = texture(texCoord, tc).xy;
    //float depth_raw = texture(depth, tc).x;

    float luminance = max(0.0, dot(aNormal, aLDir));
    //float ambientLuminance = 0.01;
    
    vec3 shade = mix(col1, col2, luminance);

    vec3 obj_albedo = texture(albedo, texCoords).rgb;

    float col_luminance = 0.299*obj_albedo.x + 0.587*obj_albedo.y + 0.114*obj_albedo.z;

    obj_albedo = vec3(col_luminance);

    //vec3 col = obj_albedo * luminance /* + luminance * lightColor.xyz * lightCoef * is_illuminated */;
    //vec3 outCol = mix(col, edgeColor.rgb, edgeMask * uEdgeOpacity);
    vec3 aCol = shade * obj_albedo;

    base_img_out = vec4(aCol, 1.0);
}