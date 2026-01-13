const webpack = require("webpack");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");

module.exports = (env, argv) => {
  const baseConfig = {
    mode: argv.mode === "production" ? "production" : "development",
    devtool: false,
    module: {
      rules: [
        { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
        {
          test: /\.css$/,
          loader: [{ loader: "style-loader" }, { loader: "css-loader" }]
        },
        {
          test: /\.(png|jpg|gif|webp|svg)$/,
          loader: [{ loader: "url-loader" }]
        }
      ]
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"]
    },
    node: {
      global: true,
      __filename: false,
      __dirname: false,
      util: 'empty',
      path: 'empty',
      fs: 'empty'
    },
    output: {
      path: path.resolve(__dirname, "dist")
    },
    plugins: [
      new webpack.EnvironmentPlugin(["NODE_ENV", "API_ROOT", "API_KEY"]),
      new webpack.BannerPlugin({
        banner: `
// Polyfill for Figma plugin environment - must run before any modules load
(function() {
  try {
    var globalObject = 
      typeof globalThis !== 'undefined' ? globalThis :
      typeof self !== 'undefined' ? self :
      typeof window !== 'undefined' ? window :
      typeof global !== 'undefined' ? global :
      Function('return this')();

    if (globalObject) {
      if (typeof globalObject.globalThis === 'undefined') {
        globalObject.globalThis = globalObject;
      }
      if (typeof globalObject.Float16Array === 'undefined') {
        globalObject.Float16Array = globalObject.Float32Array || Array;
      }
    }
  } catch (e) {}
})();
        `,
        raw: true,
        entryOnly: true
      })
    ]
  };

  return [
    {
      ...baseConfig,
      entry: {
        ui: "./plugin/ui.tsx", // The entry point for your UI code
        code: "./plugin/code.ts"
      },
      output: {
        ...baseConfig.output,
        filename: "[name].js"
      },
      optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
          terserOptions: {
            mangle: false,
            compress: false,
            output: {
              comments: false,
            },
          },
          extractComments: false,
        })],
      },
      plugins: [
        ...baseConfig.plugins,
        new HtmlWebpackPlugin({
          template: "./plugin/ui.html",
          filename: "ui.html",
          inlineSource: ".(js)$",
          chunks: ["ui"]
        }),
        new HtmlWebpackInlineSourcePlugin()
      ]
    },
    {
      ...baseConfig,
      entry: "./lib/html-to-figma.ts",
      output: {
        ...baseConfig.output,
        library: "htmlToFigma",
        libraryTarget: "var",
        filename: "browser.js"
      }
    },
    {
      ...baseConfig,
      optimization: {
        minimize: false
      },
      entry: "./lib/html-to-figma.ts",
      output: {
        ...baseConfig.output,
        library: "htmlToFigma",
        libraryExport: "htmlToFigma",
        libraryTarget: "commonjs",
        filename: "main.js"
      }
    }
  ];
};
