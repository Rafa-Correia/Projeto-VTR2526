#version 330 core

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;

uniform mat4 PVM;   // PROJECTION_VIEW_MODEL
uniform mat4 VM;    // VIEW_MODEL
uniform mat4 M;     // MODEL
uniform mat3 N;     // NORMAL (normal matrix do VIEW_MODEL)

out VS_OUT {
    vec3 vPosWS;     // para luz em world
    vec3 vNormalWS;  // para luz em world
    vec3 vPosVS;     // para hachura em view
    vec2 uv;
} vs_out;

void main()
{
    // World-space position
    vec4 posWS = M * vec4(aPos, 1.0);
    vs_out.vPosWS = posWS.xyz;

    // View-space position (estavel para padrao)
    vec4 posVS = VM * vec4(aPos, 1.0);
    vs_out.vPosVS = posVS.xyz;

    // World-space normal (derivada de M)
    mat3 normalM = transpose(inverse(mat3(M)));
    vs_out.vNormalWS = normalize(normalM * aNormal);

    vs_out.uv = aUV;

    gl_Position = PVM * vec4(aPos, 1.0);
}
