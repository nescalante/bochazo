'use strict';

var latinize = require('./string').latinize;

module.exports = {
	getAI: function(term) {
		var translate = /[aeiou]/g,
			charMap = {
				'a': '[áa]', 'e': '[ée]', 'i': '[íi]', 'o': '[óo]', 'u': '[úu]'
			},
			value = latinize(term).toLowerCase(),
			query = value.replace(translate, function(match) { 
				return charMap[match]; 
			});

		return new RegExp(query, 'i');
	}
};