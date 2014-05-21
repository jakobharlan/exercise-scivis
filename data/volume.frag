#version 140
#extension GL_ARB_shading_language_420pack : require
#extension GL_ARB_explicit_attrib_location : require

in vec3 vTexCoord;
layout(location = 0) out vec4 FragColor;

void main()
{
  FragColor = vec4(vTexCoord, 1.0);
}
