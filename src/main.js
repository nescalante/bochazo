'use strict';

var app = require('./config');

// start server
app.listen(app.get('port'), function() {
  console.log('Running ' + app.get('env') + ' environment on port ' + app.get('port'));
});
