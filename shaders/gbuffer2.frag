#version 460

layout(location = 0) out vec4 outPos;      // posVS
layout(location = 1) out vec4 outNormal;   // normalVS
layout(location = 2) out vec2 outUV;       // texcoord

in vec4 posVS;
in vec3 normalVS;
in vec2 uv;

void main()
{
    outPos = posVS;
    outNormal = vec4(normalize(normalVS) * 0.5 + 0.5, 1.0);
    outUV = uv;
}
