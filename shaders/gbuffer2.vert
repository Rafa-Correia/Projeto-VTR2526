#version 460

in vec4 position;
in vec3 normal;
in vec2 texCoord0;

uniform mat4 PVM;
uniform mat4 VM; 
uniform mat3 N;    

out vec4 posVS;
out vec3 normalVS;
out vec2 uv;

void main()
{
    gl_Position = PVM * position;
    posVS = VM * position;
    normalVS = normalize(N * normal);
    uv = texCoord0;
}
