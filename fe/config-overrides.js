/* config-overrides.js */

module.exports = function override(config, env) {
	//do stuff with the webpack config...
	config.module.rules[1].oneOf = config.module.rules[1].oneOf.map((one) => {
		if (one.exclude) {
			one.exclude = [
				/^$/,
				/\.(js|mjs|jsx|ts|tsx|mdx)$/,
				/\.html$/,
				/\.json$/,
			];
		}
		return one;
	});
	return config;
};
