/* eslint-env node */
const path = require('path');

const dist = path.join(__dirname, 'dist');

module.exports = {
    entry: [
        './src/index.js'
    ],
    output: {
        path: dist,
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            }
        ]
    },
    devtool: 'source-map',
};