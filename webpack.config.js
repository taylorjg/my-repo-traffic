/* eslint-env node */

const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require("path");

const dist = path.join(__dirname, "dist");

module.exports = {
    entry: {
        "index": "./src/index.js",
        "background": "./src/background.js"
    },
    output: {
        path: dist,
        filename: "[name].js",
    },
    plugins: [
        new CopyWebpackPlugin([
            { context: './src', from: '*.html' },
            { context: './src', from: '*.json' }
        ])
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            }
        ]
    }
};
