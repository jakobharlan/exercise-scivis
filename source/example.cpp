// -----------------------------------------------------------------------------
// Copyright  : (C) 2014 Andreas-C. Bernstein
// License    : MIT (see the file LICENSE)
// Maintainer : Andreas-C. Bernstein <andreas.bernstein@uni-weimar.de>
// Stability  : experimental
//
// Fensterchen Example
// -----------------------------------------------------------------------------
#include "fensterchen.hpp"
#include <string>
#include <iostream>
#include <fstream>
#include <algorithm>
#include <stdexcept>
#define _USE_MATH_DEFINES
#include <cmath>
#define GLM_FORCE_RADIANS

///GLM INCLUDES
#include <glm/gtc/type_ptr.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/matrix_access.hpp>
#include <glm/gtx/transform.hpp>
#include <glm/gtx/norm.hpp>

///PROJECT INCLUDES
#include <volume_loader_raw.hpp>
#include <transfer_function.hpp>
#include <utils.hpp>
#include <turntable.hpp>

const std::string g_file_vertex_shader("../../../framework/shader/volume.vert");
const std::string g_file_fragment_shader("../../../framework/shader/volume.frag");

GLuint loadShaders(std::string const& vs, std::string const& fs)
{
  std::string v = readFile(vs);
  std::string f = readFile(fs);
  return createProgram(v,f);
}

bool g_reload_shader_pressed                = false;
bool g_show_transfer_function               = false;
bool g_show_transfer_function_pressed       = false;
glm::ivec3 g_mouse_button_pressed{0,0,0};
glm::vec2  g_mouse{0.0f,0.0f};
glm::vec2  g_lastMouse{0.0f,0.0f};
Turntable  g_turntable;

///SETUP VOLUME RAYCASTER HERE
std::string g_file_string                   = "../../../data/head_w256_h256_d225_c1_b8.raw";
float       g_sampling_distance             = 0.001f;
glm::vec3   g_light_pos                     = glm::vec3(10.0, 10.0, 0.0);
glm::vec3   g_light_color                   = glm::vec3(1.0f, 1.0f, 1.0f);

struct Manipulator
{
  Manipulator()
    : m_mouse_button_pressed{0,0,0}
    , m_mouse{0.0f,0.0f}
    , m_lastMouse{0.0f,0.0f}
    , m_turntable{}
    {}

  glm::mat4 matrix(Window const& win)
  {
    m_mouse = win.mousePosition();
    if (win.isButtonPressed(Window::MOUSE_BUTTON_LEFT)) {
      if (!m_mouse_button_pressed[0]) {
        m_mouse_button_pressed[0] = 1;
      }
      m_turntable.rotate(m_lastMouse, m_mouse);
    } else {
      m_mouse_button_pressed[0] = 0;
    }

    if (win.isButtonPressed(Window::MOUSE_BUTTON_MIDDLE)) {
      if (!m_mouse_button_pressed[1]) {
        m_mouse_button_pressed[1] = 1;
      }
      m_turntable.pan(m_lastMouse, m_mouse);
    } else {
      m_mouse_button_pressed[1] = 0;
    }

    if (win.isButtonPressed(Window::MOUSE_BUTTON_RIGHT)) {
      if (!m_mouse_button_pressed[2]) {
        m_mouse_button_pressed[2] = 1;
      }
      m_turntable.zoom(m_lastMouse, m_mouse);
    } else {
      m_mouse_button_pressed[2] = 0;
    }

    m_lastMouse = m_mouse;
    return m_turntable.matrix();
  }

  glm::ivec3 m_mouse_button_pressed;
  glm::vec2  m_mouse;
  glm::vec2  m_lastMouse;
  Turntable  m_turntable;
};

int main(int argc, char* argv[])
{
  Window win(glm::ivec2(1200,800));

  Manipulator manipulator;

  ///SETTING TRANSFERFUNCTION HERE
  Transfer_function transfer_fun;

  transfer_fun.add(0.0f, glm::vec4(0.0, 1.0, 0.0, 0.0));
  transfer_fun.add(0.2f, glm::vec4(0.2, 0.0, 0.8, 0.5));
  transfer_fun.add(0.5f, glm::vec4(0.5, 0.0, 0.0, 0.0));
  transfer_fun.add(1.0f, glm::vec4(1.0, 1.0, 1.0, 1.0));

  ///NOTHING TODO UNTIL HERE
  Volume_loader_raw loader;
  glm::ivec3 vol_dimensions = loader.get_dimensions(g_file_string);

  unsigned max_dim = std::max(std::max(vol_dimensions.x,
                            vol_dimensions.y),
                            vol_dimensions.z);

  glm::vec3 max_volume_bounds = glm::vec3(vol_dimensions) / glm::vec3(max_dim);

  auto volume_data = loader.load_volume(g_file_string);

  glActiveTexture(GL_TEXTURE0);
  createTexture3D(vol_dimensions.x, vol_dimensions.y, vol_dimensions.z, (char*)&volume_data[0]);

  glActiveTexture(GL_TEXTURE1);
  createTexture2D(255u, 1u, (char*)&transfer_fun.get_RGBA_transfer_function_buffer()[0]);

  Cube cube(glm::vec3(0.0, 0.0, 0.0), max_volume_bounds);

  GLuint program(0);
  try {
    program = loadShaders(g_file_vertex_shader, g_file_fragment_shader);
  } catch (std::logic_error& e) {
    std::cerr << e.what() << std::endl;
  }

  while (!win.shouldClose()) {
    if (win.isKeyPressed(GLFW_KEY_ESCAPE)) {
      win.stop();
    }

    if (win.isKeyPressed(GLFW_KEY_R)) {
        if (g_reload_shader_pressed != true) {
            GLuint newProgram(0);
            try {
                std::cout << "Reload shaders" << std::endl;
                newProgram = loadShaders(g_file_vertex_shader, g_file_fragment_shader);
            }
            catch (std::logic_error& e) {
                std::cerr << e.what() << std::endl;
                newProgram = 0;
            }
            if (0 != newProgram) {
                glDeleteProgram(program);
                program = newProgram;
            }
            g_reload_shader_pressed = true;
        }
    } else {
        g_reload_shader_pressed = false;
    }

    if (win.isKeyPressed(GLFW_KEY_T)){
        if (!g_show_transfer_function_pressed){
            g_show_transfer_function = !g_show_transfer_function;
        }
        g_show_transfer_function_pressed = true;
    } else {
        g_show_transfer_function_pressed = false;
    }

    auto size = win.windowSize();
    glViewport(0, 0, size.x, size.y);
    //glClearColor(0.2f, .2f, .2f, 1.0f);
    //glClearColor(1.0f, 1.0f, 1.0f, 1.0f);
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    float fovy = 45.0f;
    float aspect = (float)size.x / (float)size.y;
    float zNear = 0.025, zFar = 100;
    glm::mat4 projection = glm::perspective(fovy, aspect, zNear, zFar);

    glm::vec3 translate = max_volume_bounds * glm::vec3(-0.5f);

    glm::vec3 eye = glm::vec3(0.0f, 0.0f, 2.0f);
    glm::vec3 target = glm::vec3(0.0f);
    glm::vec3 up(0.0f, 1.0f, 0.0f);

    float M_PI = 0.0f;

    auto model_view = glm::lookAt(eye, target, up)
                    * manipulator.matrix(win)
                    * glm::rotate(0.5f*float(M_PI), glm::vec3(0.0f,1.0f,0.0f))
                    * glm::rotate(0.5f*float(M_PI), glm::vec3(1.0f,0.0f,0.0f))
                    * glm::translate(translate)
                    ;

    glm::vec4 camera_translate = glm::column(glm::inverse(model_view), 3);
    glm::vec3 camera_location = glm::vec3(camera_translate.x, camera_translate.y, camera_translate.z);

    camera_location /= glm::vec3(camera_translate.w);

    glUseProgram(program);

    glUniform1i(glGetUniformLocation(program, "volume_texture"), 0);
    glUniform1i(glGetUniformLocation(program, "transfer_texture"), 1);

    glUniform3fv(glGetUniformLocation(program, "camera_location"), 1,
        glm::value_ptr(camera_location));
    glUniform1f(glGetUniformLocation(program, "sampling_distance"), g_sampling_distance);
    glUniform3fv(glGetUniformLocation(program, "max_bounds"), 1,
        glm::value_ptr(max_volume_bounds));

    glUniformMatrix4fv(glGetUniformLocation(program, "Projection"), 1, GL_FALSE,
        glm::value_ptr(projection));
    glUniformMatrix4fv(glGetUniformLocation(program, "Modelview"), 1, GL_FALSE,
        glm::value_ptr(model_view));
    cube.draw();
    glUseProgram(0);

    if (g_show_transfer_function)
        transfer_fun.update_and_draw();

    win.update();
  }

  return 0;
}
