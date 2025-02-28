const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  entry: {
    popup: "./src/popup/popup.js",
    background: "./src/background/background.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "." },
        { from: "icons", to: "icons" },
        {
          from: "./src/popup/popup.html",
          to: "popup.html",
          transform(content) {
            // Insert script tags manually
            return content
              .toString()
              .replace("</body>", '<script src="popup.js"></script></body>');
          },
        },
      ],
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
  ],
  resolve: {
    fallback: {
      path: require.resolve("path-browserify"),
      fs: false,
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      url: require.resolve("url"),
      util: require.resolve("util"),
      buffer: require.resolve("buffer/"),
      os: require.resolve("os-browserify/browser"),
      vm: false,
      tty: false,
      child_process: false,
      process: require.resolve("process/browser"),
    },
  },
  // Explicitly ignore the html-webpack-plugin warning
  ignoreWarnings: [
    /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
  ],
  devtool: "cheap-module-source-map",
};
