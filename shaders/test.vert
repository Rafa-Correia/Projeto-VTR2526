#version 460

uniform mat4 PVM;

in vec4 position;

void main() {
    gl_Position = PVM * position;
}