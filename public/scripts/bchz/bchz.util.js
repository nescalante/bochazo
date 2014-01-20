~function (b) {
	b.util = {
		getFunctionName: function (f) {
			var result = f
				.toString()
				.substr('function '.length);
			
			return result.substr(0, result.indexOf('('));
		},
		equal: function (c, x) {
			// date compare
			if (c instanceof Date && x instanceof Date) {
				return c.getTime() == x.getTime();
			}

			if (c instanceof Date != x instanceof Date) {
				return false;
			}

			// type compare
			if (typeof c !== typeof x) {
				return false;
			}

			// number or string compare
			if (typeof c === "number" || typeof c === "string") {
				return c === x;
			}

			// both undefined
			if (typeof c === "undefined") {
				return true;
			}

			// object properties compare
			for (var key in c) {
				if (c[key] !== x[key]) {
					return false;
				}
			}

			// all seems to be right
			return true;
		}
	};
}(bchz);