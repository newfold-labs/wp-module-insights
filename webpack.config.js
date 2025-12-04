const path = require('path');
const { merge } = require('webpack-merge');
const wpScriptsConfig = require('@wordpress/scripts/config/webpack.config');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const apps = [
	{
		name: 'insights-page',
		path: 'insights-page'
	}
];

const alias = {
	common: path.resolve(__dirname, '/src/common'),
};

module.exports = apps.map(({ name, path: appPath, outputOptions = {} }) =>
	merge(wpScriptsConfig, {
		entry: {
			[name]: path.resolve(__dirname, `./src/${appPath}/index.js`),
		},
		output: {
			path: path.resolve(__dirname, `./build/${name}`),
			filename: 'bundle.js',
			...outputOptions
		},
		resolve: {
			alias,
		},
		module: {
			rules: [
				{
					test: /\.css$/,
					include: [
						path.resolve(__dirname, `src/${name}/*.css`),
					],
					use: [
						MiniCssExtractPlugin.loader,
						'css-loader',
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: {
									config: path.resolve(__dirname, 'postcss.config.js'),
								},
							},
						},
					],
				},
			],
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename: '[name].css',
			}),
		],
	})
);
