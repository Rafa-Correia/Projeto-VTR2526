#version 460

uniform mat4 PVM;
uniform mat4 VM;
uniform mat4 V;

uniform mat3 N;

uniform vec4 lPos;
//uniform vec4 cPos;

in vec4 position;
in vec3 normal;

out vec3 aNormal;
out vec3 aLDir;
//out vec3 aEye;

void main() {
    vec4 aPos = VM * position;
    vec4 a_lPos = V * lPos;

    gl_Position = PVM * position;

    aNormal = normalize(N * normal);
    aLDir = normalize((a_lPos - aPos).xyz);
    //aLDir = normalize(vec3(aPos - a_lPos));
    //aEye = normalize(vec3(-aPos));
}