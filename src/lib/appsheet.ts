import path from 'path';
import fs from 'fs';
import axios from 'axios';
import {
  APIActionBody,
  BaseCols,
  FindResult,
  MapCols
} from '../types/appsheet';

const validIdRegExp = /^[-_0-9a-zA-Z]+$/;
export function validId(s: string | number): boolean {
  if (typeof s === 'number') {
    return true;
  } else if (typeof s === 'string' && s.match(validIdRegExp)) {
    return true;
  }
  return false;
}

function throwInvalidId(
  value: string,
  srcName: string,
  dstName: string,
  colType: string
) {
  throw new Error(
    `mappingCols: invalid id: value = ${value}, params = ${srcName}, ${dstName}, ${colType}`
  );
}

function throwInvalidType(
  actually: string,
  srcName: string,
  dstName: string,
  colType: string
) {
  throw new Error(
    `mappingCols: invalid type: actually type = ${actually}, params = ${srcName}, ${dstName}, ${colType}`
  );
}

export function mappingCols(s: any, m: MapCols): BaseCols {
  const n = new Date();
  const id = validId(s.id) ? s.id : throwInvalidId(s.id, 'id', 'id', 'id');
  const ret: BaseCols = {
    _RowNumber: s._RowNumber !== undefined ? s._RowNumber! : -1,
    id,
    created: s.created ? new Date(s.created) : n,
    updated: s.updated ? new Date(s.updated) : n
  };
  m.forEach(({ srcName, dstName, colType }) => {
    const srcColType = typeof s[srcName];
    switch (colType) {
      case 'id':
        if (srcColType === 'number' || srcColType === 'string') {
          if (validId(s[srcName])) {
            ret[dstName] = `${s[srcName]}`;
          } else {
            throwInvalidId(s[srcName], srcName, dstName, colType);
          }
        } else {
          throwInvalidType(srcColType, srcName, dstName, colType);
        }
        break;
      case 'number':
        if (srcColType === 'number') {
          ret[dstName] = s[srcName];
        } else {
          throwInvalidType(srcColType, srcName, dstName, colType);
        }
        break;
      case 'string':
      case 'image': // この時点では文字列として扱う(保存時にファイルをダウンロードする).
        if (srcColType === 'string' || srcColType === 'number') {
          ret[dstName] = `${s[srcName]}`;
        } else {
          ret[dstName] = `${s[srcName] || ''}`;
        }
        break;
      case 'datetime':
        ret[dstName] = new Date(`${s[srcName]}`);
        break;
    }
  });
  return ret;
}

export function apiActionPath(
  appId: string,
  table: string,
  accessKey: string
): string {
  const q = new URLSearchParams();
  q.append('ApplicationAccessKey', accessKey);
  // https://api.appsheet.com/api/v2/ と連結することを想定.
  return `apps/${encodeURIComponent(appId)}/tables/${encodeURIComponent(
    table
  )}/Action?${q.toString()}`;
}

export function apiActionBodyFind(
  props?: Record<string, string>
): APIActionBody {
  return {
    Action: 'Find',
    Properties: props || {},
    Rows: []
  };
}

export function imageURL(
  appName: string,
  tableName: string,
  fileName: string
): string {
  if (fileName) {
    const q = new URLSearchParams();
    q.append('appName', appName);
    q.append('tableName', tableName);
    q.append('fileName', fileName);
    return `https://www.appsheet.com/template/gettablefileurl?${q.toString()}`;
  }
  return '';
}

export function client(
  apiBaseURL: string,
  appId: string,
  appName: string,
  accessKey: string
) {
  return {
    find: async function (
      tableName: string,
      mapCols: MapCols,
      props?: Record<string, string>
    ): Promise<FindResult> {
      const res = await axios
        .post(
          `${apiBaseURL}${apiActionPath(appId, tableName, accessKey)}`,
          JSON.stringify(apiActionBodyFind(props)),
          {
            headers: { 'Content-Type': ' application/json' }
          }
        )
        .catch((err) => {
          console.error(
            `client.find API request error: table = ${tableName}, status = ${err.response.status}:${err.response.statusText}`
          );
          throw new Error(
            `client.find API request error: table = ${tableName}, status = ${err.response.status}:${err.response.statusText}`
          );
        });
      return {
        rows: res.data.map((row: any) => mappingCols(row, mapCols))
      };
    },
    saveImage: async function (
      tableName: string,
      src: string,
      dstDir: string
    ): Promise<string> {
      const fileName = path.basename(src);
      const savePath = path.join(dstDir, fileName);
      return new Promise((resolve, reject) => {
        axios
          .request({
            method: 'get',
            url: imageURL(appName, tableName, src),
            responseType: 'stream'
          })
          .then((response) => {
            const w = fs.createWriteStream(savePath);
            w.on('close', () => resolve(savePath));
            response.data.pipe(w);
          })
          .catch((err) => {
            console.error(
              `client.saveImage error: table = ${tableName}, status = ${err.response.status}:${err.response.statusText}`
            );
            reject(
              new Error(
                `client.saveImage error: table = ${tableName}, status = ${err.response.status}:${err.response.statusText}`
              )
            );
          });
      });
    }
  };
}
