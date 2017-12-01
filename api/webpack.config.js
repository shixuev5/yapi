const webpack = require("webpack");
const path = require("path");

module.exports = {
  entry: path.resolve(__dirname, "./main.js"),
  output: {
    filename: "api.js",
    path: path.resolve(__dirname, "../static/attachment/"),
    library: "api",
    libraryTarget: "umd"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          presets: ["env"]
        }
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      parallel: true
    })
  ]
};
