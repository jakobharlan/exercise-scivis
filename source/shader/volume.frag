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

float       start_sampling_distance             = 0.001f;

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

vec4
get_preclassification_color(vec3 in_sampling_pos){
    
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

    vec4 c_000_c = texture(transfer_texture, vec2(c_000_v, c_000_v));
    vec4 c_100_c = texture(transfer_texture, vec2(c_100_v, c_100_v));
    vec4 c_110_c = texture(transfer_texture, vec2(c_110_v, c_110_v));
    vec4 c_010_c = texture(transfer_texture, vec2(c_010_v, c_010_v));
    vec4 c_001_c = texture(transfer_texture, vec2(c_001_v, c_001_v));
    vec4 c_101_c = texture(transfer_texture, vec2(c_101_v, c_101_v));
    vec4 c_111_c = texture(transfer_texture, vec2(c_111_v, c_111_v));
    vec4 c_011_c = texture(transfer_texture, vec2(c_011_v, c_011_v));

    // Distances from Corners 
    float xd = (in_sampling_pos.x - fV.x) / (cV.x - fV.x);
    float yd = (in_sampling_pos.y - fV.y) / (cV.y - fV.y);
    float zd = (in_sampling_pos.z - fV.z) / (cV.z - fV.z);

    vec4 c00 = (1-xd)*c_000_c + xd*c_100_c;
    vec4 c10 = (1-xd)*c_010_c + xd*c_110_c;
    vec4 c01 = (1-xd)*c_001_c + xd*c_101_c;
    vec4 c11 = (1-xd)*c_011_c + xd*c_111_c;

    vec4 c0 = (1-yd)*c00 + yd*c10;
    vec4 c1 = (1-yd)*c01 + yd*c11;

    vec4 c  = (1-zd)*c0 + zd*c1;

    return c;
}

float
get_sample_data(vec3 in_sampling_pos){
#define SAMPLE 2
#if SAMPLE == 0
    return get_nearest_neighbour_sample(in_sampling_pos);
#endif
#if SAMPLE ==  1
    return get_triliniear_sample(in_sampling_pos);
#endif
#if SAMPLE == 2
	vec3 obj_to_tex = vec3(1.0) / max_bounds;
	return texture(volume_texture, in_sampling_pos * obj_to_tex).r;
#endif
}

vec3
get_gradient(vec3 in_sampling_pos)
{   
    //sampling_pos_array_space_f
    vec3 spas = in_sampling_pos * vec3(volume_dimensions);

    //6 Points arround sampling pos (in array space)
    vec3 p_x = vec3(spas.x +1, spas.y, spas.z) / vec3(volume_dimensions);
    vec3 n_x = vec3(spas.x -1, spas.y, spas.z) / vec3(volume_dimensions);
    vec3 p_y = vec3(spas.x, spas.y +1, spas.z) / vec3(volume_dimensions);
    vec3 n_y = vec3(spas.x, spas.y -1, spas.z) / vec3(volume_dimensions);
    vec3 p_z = vec3(spas.x, spas.y, spas.z +1) / vec3(volume_dimensions);
    vec3 n_z = vec3(spas.x, spas.y, spas.z -1) / vec3(volume_dimensions);

    float p_x_v = get_sample_data(p_x);
    float n_x_v = get_sample_data(n_x);
    float p_y_v = get_sample_data(p_y);
    float n_y_v = get_sample_data(n_y);
    float p_z_v = get_sample_data(p_z);
    float n_z_v = get_sample_data(n_z);

    return vec3(p_x_v - n_x_v, p_y_v - n_y_v, p_z_v - n_z_v);
}

bool
shadow(vec3 in_sampling_pos)
{   
    vec3 ray_increment = normalize(in_sampling_pos - light_position) * sampling_distance;
    vec3 sampling_pos = in_sampling_pos + ray_increment; // test, increment just to be sure we away from the surface
    bool inside_volume = inside_volume_bounds(sampling_pos);
    while (inside_volume)
    {
        // get sample
        float s = get_sample_data(sampling_pos);

        if (s > iso_value)
        {
            return true;
        }

        // increment the ray sampling position and update last samping position
        sampling_pos += ray_increment;

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }
    return false;
}

#define AUFGABE 3312  // 31 32 3311 3312 332 4 5
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
    while (inside_volume)
    {      
        // get sample
        float s = get_sample_data(sampling_pos);
        if (s > iso_value)
        {
            sum += s;
            count++;
        }

        // increment the ray sampling position
        sampling_pos  += ray_increment;

        // update the loop termination condition
        inside_volume  = inside_volume_bounds(sampling_pos);
    }
    float average = sum/count;
    // apply the transfer functions to retrieve color and opacity
    dst = texture(transfer_texture, vec2(average, average));

#endif
        
#if AUFGABE == 3311
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added

    float trans = 1.0f;
	vec3 inten = vec3(0.0 , 0.0 , 0.0);
    while (inside_volume && trans > 0.05)
    {
         // get sample
        float s = get_sample_data(sampling_pos);

        // apply transfer fuction
        vec4 color = texture(transfer_texture, vec2(s, s)); 

        // correct the alpha
        color.a = 1 - pow( 1.0 - color.a , sampling_distance / start_sampling_distance);
        vec3 cur_inten = color.a * vec3(color.r, color.g, color.b);

        // add the current intensity to the total intesity 
        inten = inten + trans * cur_inten;

        // adjust trancparcy
        trans = trans * (1 - color.a);

        // increment the ray sampling position
        sampling_pos += ray_increment;

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }
	dst = vec4(inten.r, inten.g, inten.b, (1-trans) );
	//dst = vec4(inten.r, inten.g, inten.b, 1 );
#endif 

#if AUFGABE == 3312
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added

    float trans = 1.0f;
    vec3 inten = vec3(0.0 , 0.0 , 0.0);
    while (inside_volume && trans > 0.05)
    {
        // get color
        vec4 color = get_preclassification_color(sampling_pos); 
        
        // correct the alpha
        color.a = 1 - pow( 1.0 - color.a , sampling_distance / start_sampling_distance);

        vec3 cur_inten = color.a * vec3(color.r, color.g, color.b);
        // add the current intensity to the total intesity 
        inten = inten + trans * cur_inten;

        //correct trancparcy
        trans = trans * (1 - color.a);

        // increment the ray sampling position
        sampling_pos += ray_increment;

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }
    dst = vec4(inten.r, inten.g, inten.b, (1-trans) );
    //dst = vec4(inten.r, inten.g, inten.b, 1 );
#endif 

#if AUFGABE == 332
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added

	while(inside_volume)
	{
		// increment the ray sampling position
        sampling_pos += ray_increment;

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
	}
	sampling_pos -= ray_increment;
	inside_volume = true;

	vec3 inten = vec3(0.0 , 0.0 , 0.0);
    while (inside_volume)
    {
	     // get sample
        float s = get_sample_data(sampling_pos);
		
        // apply transfer fuction
        vec4 color = texture(transfer_texture, vec2(s, s)); 

        // correct the alpha
        //color.a = 1 - pow( 1.0 - color.a , sampling_distance / start_sampling_distance);

        vec3 cur_inten = color.a * vec3(color.r, color.g, color.b);

        // add the current intensity to the total intesity 
        inten = cur_inten + inten * (1-color.a);

        // increment the ray sampling position
        sampling_pos -= ray_increment;

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }
	dst = vec4(inten.r, inten.g, inten.b, 1 );
#endif 

#if AUFGABE == 4
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added

    float trans = 1.0f;
    vec3 inten = vec3(0.0 , 0.0 , 0.0);
    while (inside_volume && trans > 0.05)
    {
        // get sample
        float s = get_sample_data(sampling_pos);
        
        // apply transfer fuction
        vec4 color = texture(transfer_texture, vec2(s, s)); 

        // correct the alpha
        color.a = 1 - pow( 1.0 - color.a , sampling_distance / start_sampling_distance);

        // PFONG
        vec3 l = (light_position - sampling_pos);
        vec3 n = (get_gradient(sampling_pos));
        vec3 v = (sampling_pos - camera_location);

        vec3 l_n = normalize(l);
        vec3 n_n = normalize(n);
        vec3 v_n = normalize(v);

        vec3 r = 2 * dot(n_n,l_n) * n_n - l_n;
        vec3 r_n = normalize(r);

        vec3 ambient = (0.1 * light_color) * color.rgb;
       
        vec3 diffuse = vec3(0);
        if (dot(l_n,n_n) > 0)
            diffuse = light_color * color.rgb * dot(l_n,n_n);

        vec3 spekular = vec3(0);
        if (dot(r_n,v_n) > 0)
            spekular = light_color * color.rgb * pow(dot(r_n,v_n),10.0);   

        vec3 phong = ambient + diffuse + spekular;
        // calculate current intesity
        vec3 cur_inten = color.a * phong.rgb;

        // add the current intensity to the total intesity 
        inten = inten + trans * cur_inten;

        //correct trancparcy
        trans = trans * (1 - color.a);

        // increment the ray sampling position
        sampling_pos += ray_increment;

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }
    dst = vec4(inten.r, inten.g, inten.b, (1-trans) );

#endif 

#if AUFGABE == 5

    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    vec3 last_sampling_pos = sampling_pos;
    vec3 middle_pos = vec3(0,0,0);
    while (inside_volume && dst.a < 0.95)
    {
        // get sample
        float s = get_sample_data(sampling_pos);

        if (s > iso_value)
        {
            // Binary Search!
            for(int i = 0; i < 5; ++i){

                middle_pos = (last_sampling_pos + sampling_pos) / 2;
                s = get_sample_data(middle_pos);
                if(s > iso_value) sampling_pos = middle_pos;
                else last_sampling_pos = middle_pos;

            }

            sampling_pos = (last_sampling_pos + sampling_pos) / 2;

            // vec3 gradient = abs ( get_gradient(sampling_pos));
            // dst = vec4(gradient.r, gradient.g, gradient.b, 1.0);

            s = get_sample_data(sampling_pos);
            s = 0.25 + s/2;
            vec4 color = vec4(s);
            
             // PFONG
             bool shadow = shadow(sampling_pos);
             // bool shadow = false;

             vec3 ambient = (0.1 * light_color) * color.rgb;
             vec3 phong = vec3(0);
             if(shadow){
                 phong = ambient;
             }else{
                 vec3 l = (light_position - sampling_pos);
                 vec3 n = (get_gradient(sampling_pos));
                 vec3 v = (sampling_pos - camera_location);

                 vec3 l_n = normalize(l);
                 vec3 n_n = normalize(n);
                 vec3 v_n = normalize(v);

                 vec3 r = 2 * dot(n_n,l_n) * n_n - l_n;
                 vec3 r_n = normalize(r);

               
                 vec3 diffuse = vec3(0);
                 if (dot(l_n,n_n) > 0)
                     diffuse = light_color * color.rgb * dot(l_n,n_n);

                 vec3 spekular = vec3(0);
                 if (dot(r_n,v_n) > 0)
                     spekular = light_color * color.rgb * pow(dot(r_n,v_n),5.0);   

                 phong = ambient + diffuse + spekular;
             }
            // set color
            //vec4 phong = texture(transfer_texture, vec2(s, s)); 
            dst = vec4(phong.rgb, 1.0);

        }

        // increment the ray sampling position and update last samping position
        last_sampling_pos = sampling_pos;
        sampling_pos += ray_increment;

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }
    
#endif 

    // return the calculated color value
    FragColor = dst;
}
