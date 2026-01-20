#version 460

in vec3 aNormal;
in vec3 aLDir;
//in vec3 aEye;

out vec4 aCol;

void main() {
    vec3 nn = normalize(aNormal);
    //vec3 nh = normalize(aHalf);

    float diffuse_coef = 1.0;
    float luminance = max(0.0, diffuse_coef * dot(nn, aLDir));
    vec3 diffColor = vec3(0.0, 1.0, 0.75);
    vec3 ambientColor = vec3(0.0, 0.01, 0.0075);
    
    aCol = vec4(diffColor * luminance + ambientColor, 1.0);
}