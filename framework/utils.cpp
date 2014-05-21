// -----------------------------------------------------------------------------
// Copyright  : (C) 2014 Andreas-C. Bernstein
// License    : MIT (see the file LICENSE)
// Maintainer : Andreas-C. Bernstein <andreas.bernstein@uni-weimar.de>
// Stability  : experimental
//
// utils
// -----------------------------------------------------------------------------

#include "utils.hpp"
#include <stdexcept>

GLuint loadShader(GLenum type, std::string const& s)
{
  GLuint id = glCreateShader(type);
  const char* source = s.c_str();
  glShaderSource(id, 1, &source, nullptr);
  glCompileShader(id);

  GLint successful;
  glGetShaderiv(id, GL_COMPILE_STATUS, &successful);

  if (!successful) {
    int length;
    glGetShaderiv(id, GL_INFO_LOG_LENGTH, &length);
    std::string info(length, ' ');

    glGetShaderInfoLog(id, length, &length, &info[0]);
    throw std::logic_error(info);
  }
  return id;
}

GLuint createProgram(std::string const& v, std::string const& f)
{
  GLuint id = glCreateProgram();

  GLuint vsHandle = loadShader(GL_VERTEX_SHADER, v);
  GLuint fsHandle = loadShader(GL_FRAGMENT_SHADER, f);
  glAttachShader(id, vsHandle);
  glAttachShader(id, fsHandle);
  // schedule for deletion
  glDeleteShader(vsHandle);
  glDeleteShader(fsHandle);

  glLinkProgram(id);
  GLint successful;

  glGetProgramiv(id, GL_LINK_STATUS, &successful);
  if (!successful) {
    int length;
    glGetProgramiv(id, GL_INFO_LOG_LENGTH, &length);
    std::string info(length, ' ');

    glGetProgramInfoLog(id, length, &length, &info[0]);
    throw std::logic_error(info);
  }
  return id;
}
