#version 460

uniform mat4 PVM;
uniform mat4 VM;
uniform mat3 N;

in vec4 position;
in vec3 normal;
in vec2 texCoord0;

out vec4 aPos;
out vec3 aNormal;
out vec2 tc;

void main() {
    gl_Position = PVM * position;

    aPos = VM * position;
    aNormal = normalize(N * normal);
    tc = texCoord0;
}