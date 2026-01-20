#version 460

uniform mat4 V;

uniform vec4 lDir;

in vec4 position;
in vec2 texCoord0;

out vec3 aLDir;
out vec2 tc;


void main() {
    gl_Position = position;

    tc = texCoord0;
    aLDir = - vec3(V * lDir);
}