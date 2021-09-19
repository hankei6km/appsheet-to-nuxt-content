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

export function mappingCols(s: any, mapCols: MapCols): BaseCols {
  const n = new Date();
  const id = validId(s.id) ? s.id : throwInvalidId(s.id, 'id', 'id', 'id');
  const ret: BaseCols = {
    _RowNumber: s._RowNumber !== undefined ? s._RowNumber! : -1,
    id,
    createdAt: s.createdAt ? new Date(s.createdAt) : n,
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : n
  };
  mapCols.forEach((m) => {
    const srcColType = typeof s[m.srcName];
    switch (m.colType) {
      case 'id':
        if (srcColType === 'number' || srcColType === 'string') {
          if (validId(s[m.srcName])) {
            ret[m.dstName] = `${s[m.srcName]}`;
          } else {
            throwInvalidId(s[m.srcName], m.srcName, m.dstName, m.colType);
          }
        } else {
          throwInvalidType(srcColType, m.srcName, m.dstName, m.colType);
        }
        break;
      case 'number':
        if (srcColType === 'number') {
          ret[m.dstName] = s[m.srcName];
        } else {
          throwInvalidType(srcColType, m.srcName, m.dstName, m.colType);
        }
        break;
      case 'string':
      case 'image': // この時点では文字列として扱う(保存時にファイルをダウンロードする).
        if (srcColType === 'string' || srcColType === 'number') {
          ret[m.dstName] = `${s[m.srcName]}`;
        } else {
          ret[m.dstName] = `${s[m.srcName] || ''}`;
        }
        break;
      case 'datetime':
        ret[m.dstName] = new Date(`${s[m.srcName]}`);
        break;
      case 'enum':
        const str = `${s[m.srcName]}`;
        const matchIdx = m.replace.findIndex(({ pattern }) =>
          str.match(pattern)
        );
        if (matchIdx >= 0) {
          ret[m.dstName] = str.replace(
            m.replace[matchIdx].pattern,
            m.replace[matchIdx].replacement
          );
        } else {
          ret[m.dstName] = str;
        }
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

export type Client = {
  find: (
    tableName: string,
    mapCols: MapCols,
    props?: Record<string, string>
  ) => Promise<FindResult>;
  saveImage: (
    tableName: string,
    src: string,
    dstDir: string
  ) => Promise<string>;
};

export function client(
  apiBaseURL: string,
  appId: string,
  appName: string,
  accessKey: string
): Client {
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
          throw new Error(
            `client.find API request error: table = ${tableName}, status = ${err.response.status}:${err.response.statusText}`
          );
        });
      if (res.data === '') {
        throw new Error(
          `client.find API request error: table = ${tableName}, empty data received`
        );
      }
      return {
        rows: res.data.map((row: any) => mappingCols(row, mapCols))
      };
    },
    saveImage: async function (
      tableName: string,
      src: string,
      dstDir: string
    ): Promise<string> {
      if (src === '') return '';
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
            w.on('error', (err) => reject(err));
            response.data.pipe(w);
          })
          .catch((err) => {
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
