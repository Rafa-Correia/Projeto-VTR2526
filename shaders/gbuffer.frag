#version 460

in vec4 aPos;
in vec3 aNormal;
in vec2 tc;

layout (location = 0) out vec4 pos;
layout (location = 1) out vec4 normal;
layout (location = 2) out vec4 texCoord;
layout (location = 3) out uint tex;

uniform int current_tex = 0; //for fruit bowl

//0 is default
//1 is bowl
//2 is bananas
//3 is apples
//4 is oranges
//5 is stem
//6 is grapes
//7 is for anything else needed!!!

void main() {
    pos = vec4(aPos.xyz, 1);
    normal = vec4(normalize(aNormal) * 0.5 + 0.5, 1);
    texCoord = vec4(tc, 0, 0);
    tex = current_tex;
}