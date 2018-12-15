const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const PHASER_DIR = path.join(__dirname, '../node_modules/phaser-ce/');

const extractStyles = new ExtractTextPlugin("styles.css");

module.exports = {
    entry: './main.js',
    devtool: 'source-map',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname),
        publicPath: '/'
    },
    plugins:[],
    resolve: {
        modules: [
            __dirname,
            'node_modules'
        ],
        alias: {
            phaser: path.resolve(__dirname, './phaser.js')
        }
    },
    devServer: {
    },
    module: {

        rules: [{
            test: /\.less$/,
            use: extractStyles.extract({use: [{
                loader: "css-loader",
                options: { importLoaders: 1, modules: true, localIdentName: '[local]' }
            }, {
                loader: "less-loader"
            }], fallback: 'style-loader'})
        },{
            test: /\.css/,
            use: extractStyles.extract({use: [{
                loader: "css-loader",
                options: { importLoaders: 1, modules: true, localIdentName: '[local]' }
            }], fallback: 'style-loader'})
        },{
            test: /\.js$/,
            use: [{
                loader: 'babel-loader'
            }]
        },{
            test: /\.(png|svg|jpg|gif)$/,
            use: [
                'file-loader?name=res/[name].[ext]'
            ]
        }]
    }
};