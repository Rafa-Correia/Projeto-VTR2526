#version 460

uniform sampler2D tex;

uniform float threshold = 0.50;

in vec3 aNormal;
in vec3 aLDir;
in vec2 texCoord;
//in vec3 aEye;

out vec4 aCol;

void main() {
    vec3 nn = normalize(aNormal);
    //vec3 nh = normalize(aHalf);

    float diffuse_coef = 1.0;
    float light_coef = 0.5;
    float luminance = max(0.0, diffuse_coef * dot(nn, aLDir));
    vec3 lightColor = vec3(1.0, 0.7, 0.3);
    //float ambientLuminance = 0.01;
    
    //quantize luminance
    if(luminance > threshold)
        luminance = 1.0;
    else if (luminance > threshold - 0.05)
        luminance = 0.75;
    else 
        luminance = 0.25;

    vec3 albedo = texture(tex, texCoord).rgb;

    aCol = vec4(albedo * luminance + luminance * lightColor * light_coef, 1.0);
}