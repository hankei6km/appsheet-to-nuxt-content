import axios from 'axios';
import {
  APIActionBody,
  BaseCols,
  FindResult,
  MapCols
} from '../types/appsheet';

export function mappingCols(s: any, m: MapCols): BaseCols {
  const n = Date.now();
  const ret: BaseCols = {
    _RowNumber: s._RowNumber !== undefined ? s._RowNumber! : -1,
    id: s.id || '',
    created: s.created ? new Date(s.created) : new Date(),
    updated: s.updated ? new Date(s.updated) : new Date()
  };
  m.forEach(({ srcName, dstName, colType }) => {
    const srcColType = typeof s[srcName];
    switch (colType) {
      case 'number':
        if (srcColType === 'number') {
          ret[dstName] = s[srcName];
        } else {
          throw new Error(
            `mappingCols: invalid type: actually type = ${srcColType}, params = ${srcName}, ${dstName}, ${colType}`
          );
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
    }
  };
}
