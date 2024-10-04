const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/js/script.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true // Clean the 'dist' folder before each build
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    hot: true, // Enable Hot Module Replacement
    open: true // Automatically open the browser
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/assets', to: 'assets' } // Copy the entire assets folder to 'dist/assets'
      ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.scss$/, // Rule for SCSS files
        use: [
          'style-loader', // Injects styles into the DOM
          {
            loader: 'css-loader', // Translates CSS into CommonJS
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader', // Compiles Sass to CSS
            options: {
              sourceMap: true,
              sassOptions: {
                // Add any custom options here
              }
            }
          }
        ]
      },
      {
        test: /\.js$/, // Rule for JavaScript files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/, // Rule for font files
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][hash][ext][query]' // Output file name and path
        }
      },
      {
        test: /\.svg$/, // Rule for SVG files
        type: 'asset/resource',
        generator: {
          filename: 'assets/icons/[name][hash][ext][query]' // Output file name and path
        }
      },
      {
        test: /\.css$/, // Rule for CSS files
        use: [
          'style-loader', // Injects styles into the DOM
          'css-loader' // Translates CSS into CommonJS
        ]
      }
    ]
  }
};
