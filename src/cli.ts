import fs from 'fs/promises';
import { Writable } from 'stream';
import { client } from './lib/appsheet';
import { saveRemoteContents } from './lib/content';

type Opts = {
  stdout: Writable;
  stderr: Writable;
  dstContentsDir: string;
  dstImagesDir: string;
  apiBaseURL: string;
  appId: string;
  appName: string;
  tableName: string;
  mapCols: string;
  accessKey: string;
  staticRoot: string;
};
const cli = async (opts: Opts): Promise<number> => {
  let cliErr: Error | null = null;
  try {
    const mapCol = JSON.parse((await fs.readFile(opts.mapCols)).toString());
    cliErr = await saveRemoteContents(
      client(opts.apiBaseURL, opts.appId, opts.appName, opts.accessKey),
      opts.tableName,
      mapCol,
      opts.dstContentsDir,
      opts.dstImagesDir,
      opts.staticRoot
    );
  } catch (err: any) {
    cliErr = err;
  }
  if (cliErr) {
    opts.stderr.write(cliErr.toString());
    opts.stderr.write('\n');
    return 1;
  }
  return 0;
};

export default cli;
