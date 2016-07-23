var webpack = require('webpack');
var path = require('path');
var fs = require('fs-extra');
var BUILD_DIR = path.resolve(__dirname, 'build/public');
var rootApp=path.resolve(__dirname, 'Client');
var rootBuild=path.resolve(__dirname, 'build');
var APP_DIR = path.resolve(__dirname, 'Client/app');
fs.copySync(path.resolve(__dirname,rootApp+'/index.html'), rootBuild+'/index.html');

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
    plugins:[
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': '"production"'
            }
        }),
        new webpack.optimize.CommonsChunkPlugin('common.js'),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.AggressiveMergingPlugin()
        
    ],
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