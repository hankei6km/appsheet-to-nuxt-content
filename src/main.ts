#!/usr/bin/env node
import yargs from 'yargs';

import { hideBin } from 'yargs/helpers';
import cli from './cli';

(async () => {
  const argv = await yargs(hideBin(process.argv))
    .scriptName('sheet2content')
    .env('SHEET2CONTENT')
    .command(
      'save <tableName> <dstContentsDir> <dstImagesDir>',
      'save remote contents to local directory',
      (yargs) => {
        return yargs
          .positional('tableName', {
            describe: 'table name to get contents',
            type: 'string'
          })
          .positional('dstContentsDir', {
            describe: 'contens directory',
            type: 'string'
          })
          .positional('dstImagesDir', {
            describe: 'images directory',
            type: 'string'
          })
          .demandOption(['tableName'])
          .demandOption(['dstContentsDir'])
          .demandOption(['dstImagesDir']);
      }
    )
    .options({
      'api-base-url': {
        type: 'string',
        required: true,
        description: 'Base URL to API endpoint'
      },
      'app-id': {
        type: 'string',
        required: true,
        description: 'app id to API endpoint'
      },
      'app-name': {
        type: 'string',
        required: true,
        description: 'app id to iamge adapter endpoint'
      },
      'map-cols': {
        type: 'string',
        required: true,
        description: 'json file name that contain mapping columns'
      },
      'access-key': {
        type: 'string',
        require: true,
        description: 'access key to get contents'
      },
      'static-root': {
        type: 'string',
        defult: 'static/',
        description: 'root of static path to trim image path'
      }
    })
    .help().argv;
  process.exit(
    await cli({
      stdout: process.stdout,
      stderr: process.stderr,
      dstContentsDir: argv.dstContentsDir,
      dstImagesDir: argv.dstImagesDir,
      apiBaseURL: argv['api-base-url'],
      appId: argv['app-id'],
      appName: argv['app-name'],
      tableName: argv.tableName,
      mapCols: argv['map-cols'],
      accessKey: argv['access-key'],
      staticRoot: argv['static-root'] || 'static/'
    })
  );
})();
