var bchz = bchz || {};

~function (b) {
	b.regex = {
		getAI: function(term) {
			var translate = /[aeiou]/g,
				charMap = {
					'a': '[áa]', 'e': '[ée]', 'i': '[íi]', 'o': '[óo]', 'u': '[úu]'
				},
				value = term.latinize().toLowerCase(),
				query = value.replace(translate, function(match) { 
					return charMap[match]; 
				});

			return new RegExp(query, 'i')
		}
	};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = b.regex;
	} 
}(bchz);