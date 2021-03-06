const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const basePath = path.resolve(__dirname, './');
module.exports = {
  entry: "./test/md5", // string | object | array
  // webpack 
  output: {
    path: path.resolve(__dirname, "dist"), // string
    filename: "bundle.js", // string
    chunkFilename: "[hash].[id].js",
    publicPath: "/dist/",
    library: "DOM", // string,
    libraryTarget: "umd"
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            babelrc: false,
            presets: ['@babel/preset-env']
          }
        }
      }
    ]

  },

  devtool: "source-map", // enum

  context: __dirname,

  target: "web", 

  devServer: {
    compress: false, // gzip
    contentBase: path.resolve(__dirname,"./", "demo"),
    clientLogLevel: 'none',
    quiet: false,
    open: true,
    historyApiFallback: {
        disableDotRule: true
    },
    watchOptions: {
        ignored: /node_modules/
    }
  },
  
  plugins: [
    // ...
    new CleanWebpackPlugin(['dist']),
    
    new webpack.HotModuleReplacementPlugin()
  ]

  // TODO

}