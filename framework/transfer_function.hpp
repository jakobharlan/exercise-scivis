#ifndef TRANSFER_FUNCTION_HPP
#define TRANSFER_FUNCTION_HPP

#include "data_types_fwd.hpp"

#include <string>
#include <map>

#include <glm/vec4.hpp>

class Transfer_function
{
public:
  typedef std::pair<unsigned, glm::vec4> element_type;
  typedef std::map<unsigned, glm::vec4>  container_type;

public:
  Transfer_function();
  ~Transfer_function() {}

  void add(float, glm::vec4);
  void add(unsigned, glm::vec4);

  void reset();

  image_data_type get_RGBA_transfer_function_buffer() const;

private:
  container_type m_piecewise_container;
};

#endif // define TRANSFER_FUNCTION_HPP
