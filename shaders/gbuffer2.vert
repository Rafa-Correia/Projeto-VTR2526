#version 460

in vec4 position;
in vec3 normal;
in vec2 texCoord0;

uniform mat4 P;
uniform mat4 V;
uniform mat4 M;

out vec4 posWS;
out vec3 normalWS;
out vec2 uv;

void main()
{
    vec4 wpos = M * position; 
    gl_Position = P * V * wpos;

    posWS    = wpos;
    normalWS = normalize(transpose(inverse(mat3(M))) * normal);
    uv       = texCoord0;
}
