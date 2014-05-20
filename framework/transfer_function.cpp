#include "transfer_function.hpp"

#include <iostream>
#include <fstream>

namespace helper {

template<typename T>
const T clamp(const T val, const T min, const T max)
{
 return ((val > max) ? max : (val < min) ? min : val);
}

template<typename T>
const T weight(const float w, const T a, const T b)
{    
    return ((1.0 - w) * a + w * b);
}

} // namespace helper

Transfer_function::Transfer_function()
  : m_piecewise_container()
{}

void Transfer_function::add(float data_value, glm::vec4 color)
{
  add((unsigned)(data_value * 255.0), color);
}

void
Transfer_function::add(unsigned data_value, glm::vec4 color)
{
  helper::clamp(data_value, 0u, 255u);
  helper::clamp(color.r, 1.0f, 1.0f);
  helper::clamp(color.g, 1.0f, 1.0f);
  helper::clamp(color.b, 1.0f, 1.0f);
  helper::clamp(color.a, 1.0f, 1.0f);

  m_piecewise_container.insert(element_type(data_value, color));
}

image_data_type Transfer_function::get_RGBA_transfer_function_buffer() const
{
  size_t buffer_size = 255 * 4; // width =255 height = 1 channels = 4 ///TODO: maybe dont hardcode?
  image_data_type transfer_function_buffer;
  transfer_function_buffer.resize(buffer_size);

  unsigned data_value_f = 0u;
  unsigned data_value_b = 255u;
  glm::vec4 color_f = glm::vec4(0.0f, 0.0f, 0.0f, 0.0f);
  glm::vec4 color_b = glm::vec4(0.0f, 0.0f, 0.0f, 0.0f);

  unsigned  e_value;
  glm::vec4 e_color;

  for (auto e : m_piecewise_container) {
    e_value = e.first;
    e_color = e.second;

    data_value_b = e_value;
    color_b = e_color;

    unsigned data_value_d = data_value_b - data_value_f;
    float step_size = 1.0 / static_cast<float>(data_value_d);
    float step = 0.0;
        
    for (unsigned i = data_value_f; i != data_value_b; ++i) {

      transfer_function_buffer[i * 4]     = static_cast<unsigned char>(helper::weight(step, color_f.r, color_b.r) * 255.0f);
      transfer_function_buffer[i * 4 + 1] = static_cast<unsigned char>(helper::weight(step, color_f.g, color_b.g) * 255.0f);
      transfer_function_buffer[i * 4 + 2] = static_cast<unsigned char>(helper::weight(step, color_f.b, color_b.b) * 255.0f);
      transfer_function_buffer[i * 4 + 3] = static_cast<unsigned char>(helper::weight(step, color_f.a, color_b.a) * 255.0f);
      step += step_size;

      std::cout << (unsigned int)transfer_function_buffer[i * 4] << std::endl;
    }

    data_value_f = data_value_b;
    color_f = color_b;
  }

  // fill TF
  data_value_b = 255u;
  color_b = glm::vec4(0.0f, 0.0f, 0.0f, 0.0f);

  if (data_value_f != data_value_b) {
    unsigned data_value_d = data_value_b - data_value_f;
    float step_size = 1.0 / static_cast<float>(data_value_d);
    float step = 0.0;
    
    for (unsigned i = data_value_f; i != data_value_b; ++i) {
      transfer_function_buffer[i * 4]     = static_cast<unsigned char>(helper::weight(step, color_f.r, color_b.r) * 255.0f);
      transfer_function_buffer[i * 4 + 1] = static_cast<unsigned char>(helper::weight(step, color_f.g, color_b.g) * 255.0f);
      transfer_function_buffer[i * 4 + 2] = static_cast<unsigned char>(helper::weight(step, color_f.b, color_b.b) * 255.0f);
      transfer_function_buffer[i * 4 + 3] = static_cast<unsigned char>(helper::weight(step, color_f.a, color_b.a) * 255.0f);
      step += step_size;
    }
  }

  return transfer_function_buffer;
}

void
Transfer_function::reset(){
    m_piecewise_container.clear();
}