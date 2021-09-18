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
  dstImageDir: string
): Promise<Error | null> {
  let ret: Error | null = null;
  try {
    const { rows } = await client.find(tableName, mapCols);
    const len = rows.length;
    for (let idx = 0; idx < len; idx++) {
      const colsArray: [string, any][] = Object.entries(rows[idx]);
      const colsLen = colsArray.length;
      for (let colsIdx = 0; colsIdx < colsLen; colsIdx++) {
        const c = colsArray[colsIdx];
        if (
          mapCols.findIndex(
            ({ dstName, colType }) => dstName === c[0] && colType === 'image'
          ) >= 0
        ) {
          c[1] = await client.saveImage(tableName, c[1], dstImageDir);
        }
      }
      const cols: BaseCols = { ...rows[idx] };
      colsArray.forEach(([k, v]) => (cols[k] = v));
      ret = await saveContentFile(cols, mapCols, dstContentDir, idx);
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
