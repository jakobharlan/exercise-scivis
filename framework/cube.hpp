#ifndef CUBE_HPP
#define CUBE_HPP

#define GLM_FORCE_RADIANS
#include <glm/vec2.hpp>
#include <glm/vec3.hpp>

class Cube
{
public:
  struct Vertex
  {
    glm::vec3 position;
    glm::vec2 texCoord;
  };

  Cube();
  void draw() const;

private:
  unsigned int m_vao;
};

#endif // CUBE_HPP
