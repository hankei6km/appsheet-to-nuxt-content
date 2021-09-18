import path from 'path';
import fs from 'fs/promises';
import matter from 'gray-matter';
import { Client } from './appsheet';
import { BaseCols, MapCols } from '../types/appsheet';

export async function saveContentFile(
  cols: BaseCols,
  mapCols: MapCols,
  dstDir: string,
  position: number
): Promise<Error | null> {
  let ret: Error | null = null;

  const savePath = `${path.resolve(dstDir, cols.id)}.md`;

  try {
    const { content, created, updated, ...metaData } = cols;
    const file = matter.stringify(content || '', { ...metaData, position });
    await fs.writeFile(savePath, file);
  } catch (err: any) {
    ret = new Error(`saveFile error: ${err}`);
  }

  return ret;
}

export async function saveRemoteContents(
  client: Client,
  tableName: string,
  mapCols: MapCols,
  dstContentDir: string,
  destImageDir: string
): Promise<Error | null> {
  let ret: Error | null = null;
  try {
    const { rows } = await client.find(tableName, mapCols);
    const len = rows.length;
    for (let idx = 0; idx < len; idx++) {
      ret = await saveContentFile(rows[idx], mapCols, dstContentDir, idx);
      if (ret) {
        break;
      }
    }
  } catch (err: any) {
    // console.log('err:', err);
    ret = new Error(`saveRemoteContents error: ${err}`);
  }
  return ret;
}
