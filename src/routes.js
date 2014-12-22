'use strict';

module.exports = [
  { route: '/', action: 'home/index' },
  { route: '/canchas/listado/:sport', action: 'place/list' },
  { route: '/canchas/:id', action: 'place/detail' },
  { route: '/canchas', action: 'place/list' },
  { route: '/busqueda', action: 'place/search' }
];
