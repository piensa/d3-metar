const path = require('path');

module.exports = {
    devtool: 'source-map',
    entry: './render.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/ }
        ]
    }
};
