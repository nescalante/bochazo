var staticModule = require('static-module');
var through = require('through2');
var path = require('path');
var taunus = require('taunus');
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
      taunify: taunify
    },
    { vars: vars }
  );

  return sm;

  function taunify() {
    var json;
    var stream = through(write, end);

    stream.push('console.log("testing");');
    stream.push('console.log(' + JSON.stringify(rc) + ');');
    stream.end('/*test*/');

    var data = getdir(rc.views);
      console.log(data);

    return stream;

    function getdir(dir, obj) {
      var result = "";
      var relativeDir = path.relative(vars.__dirname, dir).replace(/\\/g, '/') + '/';
      var files = fs.readdirSync('./' + dir);

      obj = obj || {};

      if (dir.substring(dir.length - 1, dir.length) !== '/') {
        dir += '/';
      }

      files.forEach(function (f) {
        var splitted = f.split('.');
        var name = splitted[0];
        var ext = splitted[1];

        if (splitted.length === 1) {
          // should be a directory
          getdir(dir + f + '/', obj);
        }
        else {
          obj[relativeDir + name] = 'require("./' + relativeDir + f + '")';
        }
      });

      result += '{';

      Object.keys(obj).forEach(function (key) {
        result += '"' + key + '"' + ':' + obj[key] + ',';
      });

      result = result.substring(0, result.length - 1) + '}';

      return result;
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
