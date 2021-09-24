import fs from 'fs/promises';
import { Writable } from 'stream';
import { client } from './lib/appsheet';
import { saveRemoteContents } from './lib/content';

type SaveOpts = {
  tableName: string;
  dstContentsDir: string;
  dstImagesDir: string;
  staticRoot: string;
  imageInfo: boolean;
  imageURL: boolean;
};

type Opts = {
  command: string;
  stdout: Writable;
  stderr: Writable;
  apiBaseURL: string;
  appId: string;
  appName: string;
  mapCols: string;
  accessKey: string;
  saveOpts: SaveOpts;
};
const cli = async ({
  command,
  stdout,
  stderr,
  apiBaseURL,
  appId,
  appName,
  mapCols,
  accessKey,
  saveOpts
}: Opts): Promise<number> => {
  let cliErr: Error | null = null;
  try {
    switch (command) {
      case 'save':
        cliErr = await saveRemoteContents({
          client: client(apiBaseURL, appId, appName, accessKey),
          mapCols: JSON.parse((await fs.readFile(mapCols)).toString()),
          ...saveOpts
        });
        break;
    }
  } catch (err: any) {
    cliErr = err;
  }
  if (cliErr) {
    stderr.write(cliErr.toString());
    stderr.write('\n');
    return 1;
  }
  return 0;
};

export default cli;
