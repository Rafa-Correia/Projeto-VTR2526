#version 460

in vec4 aPos;
in vec3 aNormal;
in vec2 tc;

layout (location = 0) out vec4 pos;
layout (location = 1) out vec4 normal;
layout (location = 2) out vec4 texCoord;

void main() {
    pos = vec4(aPos.xyz, 1);
    normal = vec4(normalize(aNormal) * 0.5 + 0.5, 0);
    texCoord = vec4(tc, 0, 0);
}