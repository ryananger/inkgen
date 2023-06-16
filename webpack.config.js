const path = require("path");
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: "production",
  entry: "./client/src/index.jsx",
  output: {
    path: path.join(__dirname, 'client/dist'),
    filename: "bundle.js"
  },
  optimization: {
    minimize: true
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  module: {
    rules: [
      {
        test: /\.(jsx|js)$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        use: ['style-loader','css-loader']
      },
      {
        test: /\.(png)$/,
        type: 'asset/resource'
      }
    ]
  },
  devtool: "eval-cheap-module-source-map",
  devServer: {
    static: {
      directory: path.join(__dirname, 'client/dist'),
    },
    compress: false,
    port: 9000,
  },

  plugins: [
    new Dotenv()
  ]
}
