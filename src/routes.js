'use strict';

module.exports = [
  { route: '/', action: 'home/index' },
  { route: '/canchas/:id', action: 'place/detail' },
  { route: '/canchas', action: 'place/list' }
];
