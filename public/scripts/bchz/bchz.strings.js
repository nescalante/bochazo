~function (s) {
	s.latinize = function() {
		var translate = /[áéíóúÁÉÍÓÚ]/g,
			charMap = {
				'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
				'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U'
			},
			value = this;

		return value.replace(translate, function(match) { 
			return charMap[match]; 
		});
	};
}(String.prototype);