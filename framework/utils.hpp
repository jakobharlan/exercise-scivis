#ifndef UTILS_HPP
#define UTILS_HPP

#include <string>
#include <fstream>
#include <streambuf>
#include <cerrno>

// Read a small text file.
inline std::string readFile(std::string const& file)
{
  std::ifstream in(file.c_str());
  if (in) {
    std::string str((std::istreambuf_iterator<char>(in)),
                         std::istreambuf_iterator<char>());
    return str;
  }
  throw (errno);
}

#endif // #ifndef UTILS_HPP
