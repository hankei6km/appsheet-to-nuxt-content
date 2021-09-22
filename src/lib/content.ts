import path from 'path';
import fs from 'fs/promises';
import matter from 'gray-matter';
import { Client } from './appsheet';
import { BaseCols, MapCols } from '../types/appsheet';
import sizeOf from 'image-size';
import { ISize } from 'image-size/dist/types/interface';

export async function saveContentFile(
  cols: BaseCols,
  mapCols: MapCols,
  dstDir: string,
  position: number
): Promise<Error | null> {
  let ret: Error | null = null;

  const savePath = `${path.resolve(dstDir, cols.id)}.md`;

  try {
    const { content, ...metaData } = cols;
    const file = matter.stringify(content || '', { ...metaData, position });
    await fs.writeFile(savePath, file);
  } catch (err: any) {
    ret = new Error(`saveFile error: ${err}`);
  }

  return ret;
}

export function dimensionsValue(
  dimensions: ISize,
  prop: 'width' | 'height'
): number {
  let ret = 0;
  if (Array.isArray(dimensions)) {
    if (dimensions.length > 0) {
      const c = dimensions[0];
      ret = c[prop] !== undefined ? c[prop] : 0;
    }
  } else {
    const p = dimensions[prop];
    ret = p !== undefined ? p : 0;
  }
  return ret;
}

type ImageInfo = {
  url: string; // 基本的
  size: ISize;
  meta: Record<string, any>; //  定義のみ.
};

export async function saveImageFile(
  client: Client,
  tableName: string,
  src: string,
  dstImagesDir: string
): Promise<ImageInfo> {
  const imagePath = await client.saveImage(tableName, src, dstImagesDir);
  return {
    url: imagePath,
    // TODO: orientation の処理を検討(おそらく raw などでの補正? がいると思う).
    size: await sizeOf(imagePath), // Promise が返ってくるのだが?
    meta: {}
  };
}

export async function saveRemoteContents(
  client: Client,
  tableName: string,
  mapCols: MapCols,
  dstContentDir: string,
  dstImagesDir: string,
  staticRoot: string
): Promise<Error | null> {
  const staticRootLen = staticRoot.length;
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
          const imageInfo = await saveImageFile(
            client,
            tableName,
            c[1],
            dstImagesDir
          );
          if (imageInfo.url.startsWith(staticRoot)) {
            c[1] = {
              ...imageInfo,
              url: imageInfo.url.substring(staticRootLen)
            };
          } else {
            c[1] = imageInfo;
          }
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
