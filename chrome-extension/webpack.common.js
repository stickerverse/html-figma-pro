const path = require("path");
const { copySync } = require("fs-extra-promise");
const crypto = require("crypto");

// Fix for Node.js 17+ with Webpack 4
// This resolves the OpenSSL error: error:0308010C:digital envelope routines::unsupported
const crypto_orig_createHash = crypto.createHash;
crypto.createHash = (algorithm) =>
  crypto_orig_createHash(algorithm == "md4" ? "sha256" : algorithm);

function copyInfoToDist() {
  copySync("./info", "./dist", {
    overwrite: true,
    recursive: true,
  });
}

copyInfoToDist();

module.exports = {
  entry: {
    popup: path.join(__dirname, "src/popup/index.tsx"),
    inject: path.join(__dirname, "src/inject.ts"),
    background: path.join(__dirname, "src/background.ts"),
  },
  output: {
    path: path.join(__dirname, "dist/js"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: "ts-loader",
      },
      {
        exclude: /node_modules/,
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader", // Creates style nodes from JS strings
          },
          {
            loader: "css-loader", // Translates CSS into CommonJS
          },
          {
            loader: "sass-loader", // Compiles Sass to CSS
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|webp|svg)$/,
        loader: [{ loader: "url-loader" }],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
};
