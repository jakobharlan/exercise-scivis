#version 150
#extension GL_ARB_shading_language_420pack : require
#extension GL_ARB_explicit_attrib_location : require

in vec3 ray_entry_position;
layout(location = 0) out vec4 FragColor;

uniform mat4 Modelview;

uniform sampler3D volume_texture;
uniform sampler2D transfer_texture;

uniform vec3    camera_location;
uniform float   sampling_distance;
uniform float   iso_value;
uniform vec3    max_bounds;
uniform ivec3   volume_dimensions;

uniform vec3    light_position;
uniform vec3    light_color;


bool
inside_volume_bounds(const in vec3 sampling_position)
{
    return (   all(greaterThanEqual(sampling_position, vec3(0.0)))
            && all(lessThanEqual(sampling_position, max_bounds)));
}

float
get_nearest_neighbour_sample(vec3 in_sampling_pos){
    
    vec3 obj_to_tex                 = vec3(1.0) / max_bounds;
    
    /// transform from texture space to array space
    /// ie: (0.3, 0.5, 1.0) -> (76.5 127.5 255.0)
    vec3 sampling_pos_array_space_f = in_sampling_pos * vec3(volume_dimensions);


    // this time we just round the transformed coordinates to their next integer neighbors
    // i.e. nearest neighbor filtering
    vec3 interpol_sampling_pos_f;
    interpol_sampling_pos_f.x = round(sampling_pos_array_space_f.x);
    interpol_sampling_pos_f.y = round(sampling_pos_array_space_f.y);
    interpol_sampling_pos_f.z = round(sampling_pos_array_space_f.z);
        

    /// transform from array space to texture space
    vec3 sampling_pos_texture_space_f = interpol_sampling_pos_f/vec3(volume_dimensions);

    // access the volume data
    return texture(volume_texture, sampling_pos_texture_space_f * obj_to_tex).r;
}

float
get_triliniear_sample(vec3 in_sampling_pos){
    
    vec3 obj_to_tex                 = vec3(1.0) / max_bounds;
    
    /// transform from texture space to array space
    /// ie: (0.3, 0.5, 1.0) -> (76.5 127.5 255.0)
    vec3 sampling_pos_array_space_f = in_sampling_pos * vec3(volume_dimensions);

    vec3 fV = floor(sampling_pos_array_space_f) / vec3(volume_dimensions);
    vec3 cV = ceil(sampling_pos_array_space_f) / vec3(volume_dimensions);

    vec3 c_000 = vec3(fV.x , fV.y , fV.z);
    vec3 c_100 = vec3(cV.x , fV.y , fV.z);
    vec3 c_110 = vec3(cV.x , cV.y , fV.z);
    vec3 c_010 = vec3(fV.x , cV.y , fV.z);
    
    vec3 c_001 = vec3(fV.x , fV.y ,  cV.z);
    vec3 c_101 = vec3(cV.x , fV.y ,  cV.z);
    vec3 c_111 = vec3(cV.x , cV.y ,  cV.z);
    vec3 c_011 = vec3(fV.x , cV.y ,  cV.z);
    
    float c_000_v = texture(volume_texture, c_000 * obj_to_tex).r;
    float c_100_v = texture(volume_texture, c_100 * obj_to_tex).r;
    float c_110_v = texture(volume_texture, c_110 * obj_to_tex).r;
    float c_010_v = texture(volume_texture, c_010 * obj_to_tex).r;
    
    float c_001_v = texture(volume_texture, c_001 * obj_to_tex).r;
    float c_101_v = texture(volume_texture, c_101 * obj_to_tex).r;
    float c_111_v = texture(volume_texture, c_111 * obj_to_tex).r;
    float c_011_v = texture(volume_texture, c_011 * obj_to_tex).r;

    // Distances from Corners 
    float xd = (in_sampling_pos.x - fV.x) / (cV.x - fV.x);
    float yd = (in_sampling_pos.y - fV.y) / (cV.y - fV.y);
    float zd = (in_sampling_pos.z - fV.z) / (cV.z - fV.z);

    float c00 = (1-xd)*c_000_v + xd*c_100_v;
    float c10 = (1-xd)*c_010_v + xd*c_110_v;
    float c01 = (1-xd)*c_001_v + xd*c_101_v;
    float c11 = (1-xd)*c_011_v + xd*c_111_v;

    float c0 = (1-yd)*c00 + yd*c10;
    float c1 = (1-yd)*c01 + yd*c11;

    float c  = (1-zd)*c0 + zd*c1;

    return c;
}

float
get_sample_data(vec3 in_sampling_pos){
#if 0
    return get_nearest_neighbour_sample(in_sampling_pos);
#else
    return get_triliniear_sample(in_sampling_pos);
#endif
}

float
get_gradient(vec3 in_sampling_pos, vec3 ray_increment)
{
    float before = get_sample_data(in_sampling_pos - ray_increment);
    float after = get_sample_data(in_sampling_pos + ray_increment);
    return after - before;
}

#define AUFGABE 33  // 31 32 33 4 5
void main()
{
    /// One step trough the volume
    vec3 ray_increment      = normalize(ray_entry_position - camera_location) * sampling_distance;
    /// Position in Volume
    vec3 sampling_pos       = ray_entry_position + ray_increment; // test, increment just to be sure we are in the volume

    /// Init color of fragment
    vec4 dst = vec4(0.0, 0.0, 0.0, 0.0);

    /// check if we are inside volume
    bool inside_volume = inside_volume_bounds(sampling_pos);

#if AUFGABE == 31
    vec4 max_val = vec4(0.0, 0.0, 0.0, 0.0);
    

    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume && max_val.a < 0.95) 
    {      
        // get sample
        float s = get_sample_data(sampling_pos);

        // apply the transfer functions to retrieve color and opacity
        vec4 color = texture(transfer_texture, vec2(s, s));
          
        // this is the example for maximum intensity projection
        max_val.r = max(color.r, max_val.r);
        max_val.g = max(color.g, max_val.g);
        max_val.b = max(color.b, max_val.b);
        max_val.a = max(color.a, max_val.a);
        
        // increment the ray sampling position
        sampling_pos  += ray_increment;

        // update the loop termination condition
        inside_volume  = inside_volume_bounds(sampling_pos);
    }

    dst = max_val;
#endif 
    
#if AUFGABE == 32
    
    float sum = 0.0;
    int count = 0;

    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume && dst.a < 0.95)
    {      
        // get sample
        float s = get_sample_data(sampling_pos);
        sum += s;
        count++;
        
        // increment the ray sampling position
        sampling_pos  += ray_increment;

        // update the loop termination condition
        inside_volume  = inside_volume_bounds(sampling_pos);
    }
    float average = sum/count;
    // apply the transfer functions to retrieve color and opacity
    dst = texture(transfer_texture, vec2(average, average));

#endif
        
#if AUFGABE == 33
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added

    float trans = 1.0f;
    while (inside_volume && dst.a < 0.95)
    {
        // get sample
        float s = get_sample_data(sampling_pos);

        // apply transfer fuction
        vec4 color = texture(transfer_texture, vec2(s, s)); 
        
        // add the color the the intesity 
        dst = dst + trans * color;

        //correct trancparcy
        trans = trans * (1 - color.a);

        // increment the ray sampling position
        sampling_pos += ray_increment;

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }

#endif 

#if AUFGABE == 4
    vec4 max_val = vec4(0.0, 0.0, 0.0, 0.0);
    

    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume && max_val.a < 0.95) 
    {      
        // get sample
        float s = get_sample_data(sampling_pos);

        // apply the transfer functions to retrieve color and opacity
        vec4 color = texture(transfer_texture, vec2(s, s));
        color = color * abs(get_gradient(sampling_pos, ray_increment)) * 100;   

        // this is the example for maximum intensity projection
        max_val.r = max(color.r, max_val.r);
        max_val.g = max(color.g, max_val.g);
        max_val.b = max(color.b, max_val.b);
        max_val.a = max(color.a, max_val.a);
        
        // increment the ray sampling position
        sampling_pos  += ray_increment;

        // update the loop termination condition
        inside_volume  = inside_volume_bounds(sampling_pos);
    }
    dst = max_val;
#endif 

#if AUFGABE == 5

    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added

    while (inside_volume && dst.a < 0.95)
    {
        // get sample
        float s = get_sample_data(sampling_pos);

        if (s > iso_value)
        {
            dst = vec4(0.0, 0.0, 1.0, 1.0);
        }

        // increment the ray sampling position
        sampling_pos += ray_increment;

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }
    
#endif 

    // return the calculated color value
    FragColor = dst;
}
