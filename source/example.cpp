#include "fensterchen.hpp"
#include "volume_loader_raw.hpp"
#include "transfer_function.hpp"
#include "data_types_fwd.hpp"

#include <vector>
#include <iostream>

int main(int argc, char* argv[])
{
  Window win(glm::ivec2(800,800));

  std::string file_string = "../../../data/head_w256_h256_d225_c1_b8.raw";

  Volume_loader_raw loader;
  glm::ivec3 vol_dimensions = loader.get_dimensions(file_string);
  volume_data_type volume_data = loader.load_volume(file_string);
    

  Transfer_function transfer_func;

  //transfer_func.add(0.3f, glm::vec4(0.3, 0.0, 0.0, 0.0));
  transfer_func.add(1.0f, glm::vec4(1.0, 0.0, 0.0, 0.5));
  //transfer_func.add(0.7f, glm::vec4(0.0, 0.0, 0.0, 0.0));

  image_data_type transfer_function_buffer = transfer_func.get_RGBA_transfer_function_buffer();

  while (!win.shouldClose()) {
    if (win.isKeyPressed(GLFW_KEY_ESCAPE)) {
      win.stop();
    }

    auto t = win.getTime();
    float x1(0.5 + 0.5 * std::sin(t)); float y1(0.5 + 0.5 * std::cos(t));
    float x2(0.5 + 0.5 * std::sin(2.0*t)); float y2(0.5 + 0.5 * std::cos(2.0*t));
    float x3(0.5 + 0.5 * std::sin(t-10.f)); float y3(0.5 + 0.5 * std::cos(t-10.f));

    win.drawPoint(x1, y1, 255, 0, 0);
    win.drawPoint(x2, y2, 0, 255, 0);
    win.drawPoint(x3, y3, 0, 0, 255);

    auto m = win.mousePosition();
    win.drawLine(0.1f,0.1f, 0.8f,0.1f, 255,0,0);

    win.drawLine(0.0f, m.y, 0.01f, m.y, 0,0,0);
    win.drawLine(0.99f, m.y,1.0f, m.y, 0,0,0);

    win.drawLine(m.x, 0.0f, m.x, 0.01f, 0,0,0);
    win.drawLine(m.x, 0.99f,m.x, 1.0f, 0,0,0);

    win.update();
  }

  return 0;
}
