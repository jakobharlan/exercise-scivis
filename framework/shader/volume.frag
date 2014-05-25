#version 140
#extension GL_ARB_shading_language_420pack : require
#extension GL_ARB_explicit_attrib_location : require

in vec3 ray_entry_position;
layout(location = 0) out vec4 FragColor;

uniform sampler3D volume_texture;
uniform sampler2D transfer_texture;

uniform vec3    camera_location;
uniform float   sampling_distance;
uniform vec3    max_bounds;

bool
inside_volume_bounds(const in vec3 sampling_position)
{
    return (   all(greaterThanEqual(sampling_position, vec3(0.0)))
            && all(lessThanEqual(sampling_position, max_bounds)));
}

void main()
{

    vec3 ray_increment      = normalize(ray_entry_position - camera_location) * sampling_distance;
    vec3 sampling_pos       = ray_entry_position + ray_increment; // test, increment just to be sure we are in the volume

    vec3 obj_to_tex         = vec3(1.0) / max_bounds;

    vec4 dst = vec4(0.0, 0.0, 0.0, 0.0);

    bool inside_volume = inside_volume_bounds(sampling_pos);
    
    float max_val = 0;
  
    while (inside_volume) {      
        // get sample
        float s = texture(volume_texture, sampling_pos * obj_to_tex).r;
        
        max_val = max(s, max_val);
        
        // increment ray
        sampling_pos  += ray_increment;
        inside_volume  = inside_volume_bounds(sampling_pos);
    }
    dst = vec4(max_val);

  FragColor = dst;

}
