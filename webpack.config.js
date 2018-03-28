/* eslint-env node */

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
