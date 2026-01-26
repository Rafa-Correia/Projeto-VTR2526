#version 460

uniform sampler2D default_albedo;

uniform sampler2D bowl;
uniform sampler2D banana;
uniform sampler2D apple;
uniform sampler2D orange;
uniform sampler2D stem;
uniform sampler2D grape;

uniform sampler2D pos;
uniform sampler2D normal;
uniform sampler2D texCoord;
uniform usampler2D tex;

uniform float lightCoef = 0.5;
uniform float diffuseCoef = 1.0;
uniform vec4 lightColor = vec4(1.0, 0.7, 0.3, 1.0);

uniform float shininess = 512;
uniform vec4 specular_color = vec4(1);

in vec3 aLDir;
in vec2 tc;

layout (location = 0) out vec4 base_img_out;

vec3 getAlbedo(vec2 texC) {
    uint tex = texture(tex, tc).r;
    
    
    if(tex == 1)
        return texture(bowl, texC).rgb;
    else if(tex == 2)
        return texture(banana, texC).rgb;
    else if(tex == 3)
        return texture(apple, texC).rgb;
        //return vec3(1.0, 0.0, 0.0);
    else if(tex == 4)
        return texture(orange, texC).rgb;
        //return vec3(0.0, 1.0, 0.0);
    else if(tex == 5)
        return texture(stem, texC).rgb;
    else if(tex == 6)
        return texture(grape, texC).rgb;

    return texture(default_albedo, texC).rgb;
}

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

    //vec3 obj_albedo = texture(albedo, texCoords).rgb;
    vec3 obj_albedo = getAlbedo(texCoords);

    vec3 col = obj_albedo * luminance + luminance * lightColor.xyz * lightCoef + specular_component * specular_color.rgb;
    //vec3 outCol = mix(col, edgeColor.rgb, edgeMask * uEdgeOpacity);

    base_img_out = vec4(col, 1.0);
}