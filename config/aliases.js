const path = require('path');

const pathinClient = endPath => path.join(process.cwd(), 'src', endPath);

module.exports = {
  utils: pathinClient("utils"),
};