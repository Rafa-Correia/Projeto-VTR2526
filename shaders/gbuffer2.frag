#version 460

layout(location = 0) out vec4 outPos;      
layout(location = 1) out vec4 outNormal;  
layout(location = 2) out vec2 outUV;      

in vec4 posWS;
in vec3 normalWS;
in vec2 uv;

void main()
{
    outPos    = posWS;
    outNormal = vec4(normalize(normalWS) * 0.5 + 0.5, 1.0);
    outUV     = uv;
}
