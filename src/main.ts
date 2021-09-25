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
          .options({
            'static-root': {
              type: 'string',
              defult: 'static/',
              description: 'root of static path to trim image path'
            },
            'image-info': {
              type: 'boolean',
              defult: 'false',
              description: 'extract information of image(size, meta)'
            },
            'image-url': {
              type: 'boolean',
              defult: 'false',
              description:
                'generate image url from rel path to fetch image filee'
            }
          })
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
        required: false,
        description: 'app id to iamge adapter endpoint'
      },
      'map-config': {
        type: 'string',
        required: true,
        description: 'json file name that contain mapping columns etc.'
      },
      'access-key': {
        type: 'string',
        require: true,
        description: 'access key to get contents'
      }
    })
    .help().argv;
  process.exit(
    await cli({
      command: `${argv._[0]}`,
      stdout: process.stdout,
      stderr: process.stderr,
      apiBaseURL: argv['api-base-url'],
      appId: argv['app-id'],
      appName: argv['app-name'] || '',
      mapConfig: argv['map-config'],
      accessKey: argv['access-key'],
      saveOpts: {
        tableName: argv.tableName,
        dstContentsDir: argv.dstContentsDir,
        dstImagesDir: argv.dstImagesDir,
        staticRoot: argv['static-root'] || 'static/',
        imageInfo: argv['image-info'] || false,
        imageURL: argv['image-url'] || false
      }
    })
  );
})();
