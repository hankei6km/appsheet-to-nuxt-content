import path from 'path';
import fs from 'fs/promises';
import matter from 'gray-matter';
import { Client } from './appsheet';
import { BaseCols, MapCols, MapConfig } from '../types/appsheet';
import sizeOf from 'image-size';
import { ISize } from 'image-size/dist/types/interface';

export async function saveContentFile(
  cols: BaseCols,
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
  size: {} | ISize;
  meta: Record<string, any>; //  定義のみ.
};

export async function saveImageFile(
  client: Client,
  tableName: string,
  src: string,
  dstImagesDir: string,
  imageInfo: boolean,
  imageURL: boolean
): Promise<ImageInfo> {
  const imagePath = await client.saveImage(
    tableName,
    src,
    dstImagesDir,
    imageURL
  );
  return {
    url: imagePath,
    // TODO: orientation の処理を検討(おそらく raw などでの補正? がいると思う).
    size:
      imageInfo && imagePath
        ? await sizeOf(imagePath) // Promise が返ってくるのだが?
        : {}, // { width: undefined, height: undefined } の代わり.
    meta: {}
  };
}

export type SaveRemoteContentsOptions = {
  client: Client;
  tableName: string;
  mapConfig: MapConfig;
  dstContentsDir: string;
  dstImagesDir: string;
  staticRoot: string;
  imageInfo: boolean;
  imageURL: boolean;
};

export async function saveRemoteContents({
  client,
  tableName,
  mapConfig,
  dstContentsDir,
  dstImagesDir,
  staticRoot,
  imageInfo,
  imageURL
}: SaveRemoteContentsOptions): Promise<Error | null> {
  const staticRootLen = staticRoot.length;
  let ret: Error | null = null;
  try {
    const { rows } = await client.find(tableName, mapConfig);
    const len = rows.length;
    for (let idx = 0; idx < len; idx++) {
      const colsArray: [string, any][] = Object.entries(rows[idx]);
      const colsLen = colsArray.length;
      for (let colsIdx = 0; colsIdx < colsLen; colsIdx++) {
        const c = colsArray[colsIdx];
        if (
          mapConfig.cols.findIndex(
            ({ dstName, colType }) => dstName === c[0] && colType === 'image'
          ) >= 0
        ) {
          const info = await saveImageFile(
            client,
            tableName,
            c[1],
            dstImagesDir,
            imageInfo,
            imageURL
          );
          if (info.url.startsWith(staticRoot)) {
            c[1] = {
              ...info,
              url: info.url.substring(staticRootLen)
            };
          } else {
            c[1] = info;
          }
        }
      }
      const cols: BaseCols = { ...rows[idx] };
      colsArray.forEach(([k, v]) => (cols[k] = v));
      ret = await saveContentFile(cols, dstContentsDir, idx);
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
