#version 140
#extension GL_ARB_shading_language_420pack : require
#extension GL_ARB_explicit_attrib_location : require

in vec3 vTexCoord;
layout(location = 0) out vec4 FragColor;

uniform sampler3D volume_texture;
uniform sampler2D transfer_texture;

void main()
{
  vec4 color = texture(transfer_texture, vTexCoord.xy);  
  color.a = 1.0;
  //FragColor = vec4(vTexCoord, 1.0);
  FragColor = color;
}
