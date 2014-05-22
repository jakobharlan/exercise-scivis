// -----------------------------------------------------------------------------
// Copyright  : (C) 2014 Andreas-C. Bernstein
// License    : MIT (see the file LICENSE)
// Maintainer : Andreas-C. Bernstein <andreas.bernstein@uni-weimar.de>
// Stability  : experimental
//
// Cube
// -----------------------------------------------------------------------------

#include "cube.hpp"
#include <GL/glew.h>
#include <GL/gl.h>
#include <array>

namespace {


    std::array<Cube::Vertex, 36> get_cubeVertices(glm::vec3 min, glm::vec3 max) {

        return std::array<Cube::Vertex, 36>{
            // bottom
            Cube::Vertex{ glm::vec3{ min.x, min.y, min.z }, glm::vec2{ 0.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ max.x, min.y, min.z }, glm::vec2{ 1.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ min.x, min.y, max.z }, glm::vec2{ 0.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ max.x, min.y, min.z }, glm::vec2{ 1.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ max.x, min.y, max.z }, glm::vec2{ 1.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ min.x, min.y, max.z }, glm::vec2{ 0.0f, 1.0f } },

                // top
                Cube::Vertex{ glm::vec3{ min.x, max.y, min.z }, glm::vec2{ 0.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ min.x, max.y, max.z }, glm::vec2{ 0.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ max.x, max.y, min.z }, glm::vec2{ 1.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ max.x, max.y, min.z }, glm::vec2{ 1.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ min.x, max.y, max.z }, glm::vec2{ 0.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ max.x, max.y, max.z }, glm::vec2{ 1.0f, 1.0f } },
                                           
                // front              
                Cube::Vertex{ glm::vec3{ min.x, min.y, max.z }, glm::vec2{ 1.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ max.x, min.y, max.z }, glm::vec2{ 0.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ min.x, max.y, max.z }, glm::vec2{ 1.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ max.x, min.y, max.z }, glm::vec2{ 0.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ max.x, max.y, max.z }, glm::vec2{ 0.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ min.x, max.y, max.z }, glm::vec2{ 1.0f, 1.0f } },
                                            
                // back                     
                Cube::Vertex{ glm::vec3{ min.x, min.y, min.z }, glm::vec2{ 0.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ min.x, max.y, min.z }, glm::vec2{ 0.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ max.x, min.y, min.z }, glm::vec2{ 1.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ max.x, min.y, min.z }, glm::vec2{ 1.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ min.x, max.y, min.z }, glm::vec2{ 0.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ max.x, max.y, min.z }, glm::vec2{ 1.0f, 1.0f } },
                                           
                // left                     .
                Cube::Vertex{ glm::vec3{ min.x, min.y, max.z }, glm::vec2{ 0.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ min.x, max.y, min.z }, glm::vec2{ 1.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ min.x, min.y, min.z }, glm::vec2{ 0.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ min.x, min.y, max.z }, glm::vec2{ 0.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ min.x, max.y, max.z }, glm::vec2{ 1.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ min.x, max.y, min.z }, glm::vec2{ 1.0f, 0.0f } },
                                            
                // right                    
                Cube::Vertex{ glm::vec3{ max.x, min.y, max.z }, glm::vec2{ 1.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ max.x, min.y, min.z }, glm::vec2{ 1.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ max.x, max.y, min.z }, glm::vec2{ 0.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ max.x, min.y, max.z }, glm::vec2{ 1.0f, 1.0f } },
                Cube::Vertex{ glm::vec3{ max.x, max.y, min.z }, glm::vec2{ 0.0f, 0.0f } },
                Cube::Vertex{ glm::vec3{ max.x, max.y, max.z }, glm::vec2{ 0.0f, 1.0f } }
        };
    }
}

Cube::Cube()
  : m_vao(0)
{

  std::array<Cube::Vertex, 36> cubeVertices = get_cubeVertices(glm::vec3(-1.0f), glm::vec3(1.0f));

  glGenVertexArrays(1, &m_vao);
  glBindVertexArray(m_vao);

  GLuint vbo;
  glGenBuffers(1, &vbo);
  glBindBuffer(GL_ARRAY_BUFFER, vbo);

  glBufferData(GL_ARRAY_BUFFER, sizeof(float) * 5 * cubeVertices.size()
              , cubeVertices.data(), GL_STATIC_DRAW);

  glEnableVertexAttribArray(0);
  glEnableVertexAttribArray(1);
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5*sizeof(GLfloat), nullptr);
  glVertexAttribPointer(1, 2, GL_FLOAT, GL_TRUE, 5*sizeof(GLfloat), (GLvoid*)(3*sizeof(GLfloat)));
  glBindVertexArray(0);
}

Cube::Cube(glm::vec3 min, glm::vec3 max)
: m_vao(0)
{

    std::array<Cube::Vertex, 36> cubeVertices = get_cubeVertices(min, max);

    glGenVertexArrays(1, &m_vao);
    glBindVertexArray(m_vao);

    GLuint vbo;
    glGenBuffers(1, &vbo);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);

    glBufferData(GL_ARRAY_BUFFER, sizeof(float)* 5 * cubeVertices.size()
        , cubeVertices.data(), GL_STATIC_DRAW);

    glEnableVertexAttribArray(0);
    glEnableVertexAttribArray(1);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(GLfloat), nullptr);
    glVertexAttribPointer(1, 2, GL_FLOAT, GL_TRUE, 5 * sizeof(GLfloat), (GLvoid*)(3 * sizeof(GLfloat)));
    glBindVertexArray(0);
}

void Cube::draw() const
{
  glBindVertexArray(m_vao);
  glDrawArrays(GL_TRIANGLES, 0, 36);
  glBindVertexArray(0);
}
