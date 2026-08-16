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
        // One entry per microfrontend this host consumes.
        //
        // The key is the federation-safe name you import from ("exampleremote/Button").
        // The string passed to remoteUrl() is the *slug* of the microfrontend in the
        // orchestrator: change it to yours, and add one entry per extra remote.
        //
        // Never write a URL here. The host does not choose the version it gets: the
        // backend resolves it and remoteUrl() returns that URL, already pinned, verbatim.
        exampleremote: `promise import('@mfe-orchestrator-hub/client').then(m => m.remoteUrl('example-remote'))`,
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
