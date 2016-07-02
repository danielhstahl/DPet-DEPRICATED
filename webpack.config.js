var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'Client/public');
var APP_DIR = path.resolve(__dirname, 'Client/app');
var config = {
    entry: APP_DIR + '/app.js',
    output: {
        path: BUILD_DIR,
        filename: 'bundle.js'
    },
    resolve: {
        modulesDirectories: ['node_modules', 'Client/app'],
        alias: {},
        extensions: ['', '.jsx', '.js', '.css', '.scss']
    },
    module : {
        preLoaders: [
            { test: /\.json$/, loader: 'json-loader'},
        ],
        loaders : [
            {
                test : /\.js$/,
                include : APP_DIR,
                loader : 'babel',
                //exclude: /node_modules/
            },
            {
              test: /(\.scss|\.css)$/,
              loader: 'style!css?modules',
              include: /flexboxgrid/,
            }
        ]
    }
};

module.exports = config;