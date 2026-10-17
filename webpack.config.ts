import { AngularWebpackPlugin } from '@ngtools/webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, { type Configuration } from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';

const { ModuleFederationPlugin } = webpack.container;

interface WebpackConfiguration extends Configuration {
  devServer?: DevServerConfiguration;
}

// Configuration handed to the SDK's configure(), injected at build time and read in src/index.ts.
// See .env.example.
const mfeEnv: { backendUrl: string; projectId: string; environment?: string } = {
  backendUrl: process.env['MFE_BACKEND_URL'] || 'https://console.mfe-orchestrator.dev/api',
  projectId: process.env['MFE_PROJECT_ID'] || '',
};

// The orchestrator environment is optional. When MFE_ENVIRONMENT is unset the key is left out
// entirely — the SDK then asks for the "auto" route and the backend resolves the environment from
// the domain the page is served on. Never inject an empty string or the string "undefined" here:
// the SDK would take it for a real slug and ask for an environment that does not exist.
if (process.env['MFE_ENVIRONMENT']) {
  mfeEnv.environment = process.env['MFE_ENVIRONMENT'];
}

const config: WebpackConfiguration = {
  entry: './src/index',
  mode: 'development',
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  output: {
    // Chunks are resolved from document.currentScript.src, which is the URL
    // before any redirect. Leave this on 'auto' so a version pinned entry keeps
    // loading its own chunks and two builds never mix on one page.
    publicPath: 'auto',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      // The Angular packages ship partially compiled: the linker finishes them at
      // build time, the way the Angular CLI does. Without it the app does not
      // boot ("needs to be compiled using the JIT compiler").
      {
        test: /\.[cm]?js$/,
        include: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['@angular/compiler-cli/linker/babel'],
            compact: false,
            cacheDirectory: true,
          },
        },
      },
      // AngularWebpackPlugin installs the AOT compiler behind this loader.
      {
        test: /\.[cm]?[jt]sx?$/,
        loader: '@ngtools/webpack',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new AngularWebpackPlugin({
      tsconfig: 'tsconfig.json',
      jitMode: false,
    }),
    new webpack.DefinePlugin({
      MFE_ENV: JSON.stringify(mfeEnv),
    }),
    new ModuleFederationPlugin({
      name: 'host',
      // A host is consumable as a remote too, so it ships its own entry.
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/app/app.component.ts',
      },
      remotes: {
        // One entry per microfrontend this host consumes:
        // - the key is the name you import from ("exampleremote/Button"), and it needs
        //   a module declaration in src/globals.d.ts;
        // - 'example-remote' is the *slug* of the microfrontend in the orchestrator;
        // - 'exampleremote' is the scope, the remote's own ModuleFederationPlugin
        //   `name`. A remote created by the console from a webpack template is named
        //   after its slug, slashes to underscores and dashes removed.
        // Never write a URL here: the backend decides which version is served, and
        // loadWebpackRemote() resolves it, injects that remoteEntry.js and returns the
        // container. The SDK publishes it on globalThis when configure() runs.
        exampleremote: "promise globalThis.__MFE_ORCHESTRATOR__.loadWebpackRemote('example-remote', 'exampleremote')",
      },
      shared: {
        '@angular/core': { singleton: true, strictVersion: false },
        '@angular/common': { singleton: true, strictVersion: false },
        '@angular/platform-browser': { singleton: true, strictVersion: false },
        rxjs: { singleton: true, strictVersion: false },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};

export default config;
