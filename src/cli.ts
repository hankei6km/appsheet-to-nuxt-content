import fs from 'fs/promises';
import { Writable } from 'stream';
import { client } from './lib/appsheet';
import { saveRemoteContents } from './lib/content';

type Opts = {
  command: string;
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
const cli = async ({
  command,
  stdout,
  stderr,
  dstContentsDir,
  dstImagesDir,
  apiBaseURL,
  appId,
  appName,
  tableName,
  mapCols,
  accessKey,
  staticRoot
}: Opts): Promise<number> => {
  let cliErr: Error | null = null;
  try {
    switch (command) {
      case 'save':
        cliErr = await saveRemoteContents({
          client: client(apiBaseURL, appId, appName, accessKey),
          tableName,
          mapCols: JSON.parse((await fs.readFile(mapCols)).toString()),
          dstContentsDir,
          dstImagesDir,
          staticRoot
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
