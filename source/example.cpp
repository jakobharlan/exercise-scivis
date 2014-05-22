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

#define GLM_FORCE_RADIANS
#include <glm/gtc/type_ptr.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtx/transform.hpp>
#include <glm/gtx/norm.hpp>
#include <stdexcept>
#include "volume_loader_raw.hpp"
#include "transfer_function.hpp"
#include "utils.hpp"

const std::string g_file_vertex_shader("../../../data/volume.vert");
const std::string g_file_fragment_shader("../../../data/volume.frag");

GLuint loadShaders(std::string const& vs, std::string const& fs)
{
  std::string v = readFile(vs);
  std::string f = readFile(fs);
  return createProgram(v,f);
}

bool reload_shader_pressed              = false;
bool show_transfer_function             = false;
bool show_transfer_function_pressed     = false;

int main(int argc, char* argv[])
{
  Window win(glm::ivec2(1200,800));

  std::string file_string = "../../../data/head_w256_h256_d225_c1_b8.raw";

  Volume_loader_raw loader;
  glm::ivec3 vol_dimensions = loader.get_dimensions(file_string);
  auto volume_data = loader.load_volume(file_string);

  glActiveTexture(GL_TEXTURE0);
  createTexture3D(vol_dimensions.x, vol_dimensions.y, vol_dimensions.z, (char*)&volume_data[0]);

  Transfer_function transfer_fun;
  
  transfer_fun.add(0.1f, glm::vec4(0.0, 0.0, 0.0, 0.0));
  transfer_fun.add(0.2f, glm::vec4(0.0, 0.0, 1.0, 0.2));
  transfer_fun.add(0.3f, glm::vec4(1.0, 0.0, 0.0, 0.0));
  transfer_fun.add(0.6f, glm::vec4(0.0, 1.0, 0.0, 0.0));
  transfer_fun.add(0.8f, glm::vec4(0.7, 1.0, 0.8, 0.5));
  transfer_fun.add(0.9f, glm::vec4(0.0, 0.0, 0.0, 0.0));

  glActiveTexture(GL_TEXTURE1);
  createTexture2D(255u, 1u, (char*)&transfer_fun.get_RGBA_transfer_function_buffer()[0]);
  
  Cube cube;

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
        if (reload_shader_pressed != true){
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
            reload_shader_pressed = true;
        }
    }
    else{
        reload_shader_pressed = false;
    }

    if (win.isKeyPressed(GLFW_KEY_T)){
        if (!show_transfer_function_pressed){
            show_transfer_function = !show_transfer_function;
        }        
        show_transfer_function_pressed = true;
    }
    else{
        show_transfer_function_pressed = false;
    }

    auto t = win.getTime();
    auto size = win.windowSize();
    glViewport(0, 0, size.x, size.y);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    float fovy = 90.0f;
    float aspect = (float)size.x / (float)size.y;
    float zNear = 0.025, zFar = 100;
    glm::mat4 projection = glm::perspective(fovy, aspect, zNear, zFar);
    auto  xlate = glm::translate(glm::vec3(0.0f,0.0f, -3.0f));
    auto  model = xlate;
    glm::vec3 eye(5.0f*std::sin(t),0,5.0f*std::cos(t));
    glm::vec3 target(0,0,0);
    glm::vec3 up(0,1,0);
    auto view = glm::lookAt(eye, target, up);

    glUseProgram(program);
    glUniform1i(glGetUniformLocation(program, "volume_texture"), 0);
    glUniform1i(glGetUniformLocation(program, "transfer_texture"), 1);

    glUniformMatrix4fv(glGetUniformLocation(program, "Projection"), 1, GL_FALSE,
        glm::value_ptr(projection));
    glUniformMatrix4fv(glGetUniformLocation(program, "Modelview"), 1, GL_FALSE,
        glm::value_ptr(view));
    cube.draw();
    glUseProgram(0);

    if (show_transfer_function)
        transfer_fun.update_and_draw();

    win.update();
  }

  return 0;
}
