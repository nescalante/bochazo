var staticModule = require('static-module');
var through = require('through2');
var path = require('path');
var jade = require('jade');
var fs = require('fs');
var rc = require('taunus/lib/rc');

module.exports = function (file, opts) {
  if (/\.json$/.test(file)) return through();
  var vars = {
    __filename: file,
    __dirname: path.dirname(file)
  };

  if (!opts) opts = {};
  if (opts.vars) Object.keys(opts.vars).forEach(function (key) {
    vars[key] = opts.vars[key];
  });

  var sm = staticModule({
      taunus: build
    },
    { vars: vars }
  );

  return sm;

  function build() {
    var json;
    var stream = through(write, end);
    var cwd = process.cwd();

    stream.push('{ mount: function (container, options) { require("taunus").mount(container, ')
    stream.push('{\n');
    getdir('controllers', rc.client_controllers); stream.push(',');
    getdir('templates', rc.views);
    stream.push(',"routes": require("' + path.join(cwd, rc.server_routes).replace(/\\/g, '/') + '") }');
    stream.end(', options); } }\n');

    return stream;

    function getdir(name, dir) {
      var count = 0;
      var root = path.join(cwd, dir).replace(/\\/g, '/') + '/';

      stream.push('"' + name + '"' + ':' + ' {\n');
      scandir(root);
      stream.push('\n}');

      function scandir(dir, obj) {
        var relativeDir = path.relative(root, dir).replace(/\\/g, '/') + '/';
        var files = fs.readdirSync(dir);

        if (dir.substring(dir.length - 1, dir.length) !== '/') {
          dir += '/';
        }

        files.forEach(function (f, ix) {
          var splitted = f.split('.');
          var name = splitted[0];
          var ext = splitted[1];
          var html, fn;

          if (splitted.length === 1) {
            // should be a directory
            scandir(dir + f + '/', obj);
          }
          else
          {
            if (count++ !== 0) {
              stream.push(',\n');
            }

            if (ext === 'jade') {
              html = fs.readFileSync(dir + f);
              fn = jade.compileClient(html, { filename: dir + f });
              stream.push('"' + relativeDir + name + '"' + ':function(locals){var jade=require("jade/runtime");return (' + fn.toString() + ')(locals)}');
            }
            else {
              stream.push('"' + relativeDir + name + '"' + ':require("' + dir + f + '")');
            }
          }
        });

        return obj;

        function getPath(currentDir) {
          path.join(vars.__dirname, currentDir);
        }
      }
    }

    function write(buf, enc, next) {
      this.push(buf);
      next();
    }

    function end(next) {
      this.push(null);
      next();
    }
  }
};
