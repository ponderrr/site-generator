const { cpus } = require('os');
const path = require('path');

module.exports = (env, argv) => ({
  mode: env.production ? 'production' : 'development',
  devtool: env.production ? 'source-map' : 'eval-cheap-module-source-map',

  // Performance optimizations
  target: 'node',
  externals: [
    'node:*',
    '@node/*'
  ],

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    mainFields: ['module', 'main'],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'swc-loader',
            options: require('./swc.config.js')
          }
        ],
        exclude: /node_modules/
      }
    ]
  },

  optimization: {
    // Parallel processing
    splitChunks: {
      chunks: 'all',
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendors',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]/,
          priority: 20
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'async',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true
        }
      }
    },

    // Runtime chunk for better caching
    runtimeChunk: {
      name: 'runtime'
    },

    // Minimize for production
    minimize: env.production,
    minimizer: env.production ? [
      new (require('terser-webpack-plugin'))({
        parallel: cpus().length, // Use all 16 processors
        terserOptions: {
          compress: {
            drop_console: env.production,
            drop_debugger: env.production
          }
        }
      })
    ] : []
  },

  // Parallel processing
  parallel: cpus().length, // Use all 16 logical processors

  // Memory management
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
    hints: env.production ? 'warning' : false
  },

  stats: {
    colors: true,
    hash: false,
    version: false,
    timings: true,
    assets: true,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    errors: true,
    errorDetails: true,
    warnings: true,
    publicPath: false
  }
});
