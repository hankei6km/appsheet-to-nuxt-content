import {
  apiActionBodyFind,
  apiActionPath,
  client,
  imageURL,
  mappingCols,
  validId
} from './appsheet';
import mockAxios from 'jest-mock-axios';

afterEach(() => {
  mockAxios.reset();
});

jest.mock('fs', () => {
  const mockWrite = jest.fn();
  const mockCreateWriteStream = jest.fn();
  const reset = () => {
    mockWrite.mockReset();
    mockCreateWriteStream.mockReset().mockImplementation(() => {
      let handler: any = () => {};
      return {
        write: mockWrite,
        on: (e: any, h: any) => {
          if (e === 'close') {
            handler = h;
            process.nextTick(h); // TODO: jest-mock-axios の pipe の挙動調べる.
          }
        },
        close: () => handler()
      };
    });
  };

  reset();
  return {
    createWriteStream: mockCreateWriteStream,
    _reset: reset,
    _getMocks: () => ({
      mockWrite,
      mockCreateWriteStream
    })
  };
});

afterEach(() => {
  require('fs')._reset();
});

const orgConsoleError = console.error;

beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = orgConsoleError;
});

describe('validId', () => {
  test('should return true', () => {
    expect(validId(123)).toBeTruthy();
    expect(validId('id')).toBeTruthy();
    expect(validId('ID')).toBeTruthy();
    expect(validId('123abcABC')).toBeTruthy();
    expect(validId('123-abc_ABC')).toBeTruthy();
    expect(
      validId(
        '-_0123456789abcdefghijklmnopqrstuvwxyZABCDEFGHIJKLMNOPQRSTUVWXYZ'
      )
    ).toBeTruthy();
  });
  test('should return false', () => {
    expect(validId('')).not.toBeTruthy();
    expect(validId('post.md')).not.toBeTruthy();
    expect(validId('path/../../../../../to/post')).not.toBeTruthy();
  });
});

describe('mappingCols', () => {
  test('should map cols', () => {
    const n = new Date().toUTCString();
    expect(
      mappingCols(
        {
          _RowNumber: 1,
          id: 'idstring',
          createdAt: n,
          updatedAt: n,
          タイトル: 'Title',
          回数: 21,
          タイムスタンプ: n,
          画像: 'アプリ_Images/test.png',
          色: '赤',
          背景色: '青'
        },
        {
          cols: [
            {
              srcName: 'タイトル',
              dstName: 'title',
              colType: 'string'
            },
            {
              srcName: '回数',
              dstName: 'count',
              colType: 'number'
            },
            {
              srcName: 'タイムスタンプ',
              dstName: 'timestamp',
              colType: 'datetime'
            },
            {
              srcName: '画像',
              dstName: 'image',
              colType: 'image'
            },
            {
              srcName: '色',
              dstName: 'color',
              colType: 'enum',
              replace: []
            },
            {
              srcName: '背景色',
              dstName: 'bgColor',
              colType: 'enum',
              replace: [
                { pattern: '赤', replacement: 'red' },
                { pattern: '青', replacement: 'blue' }
              ]
            }
          ]
        }
      )
    ).toEqual({
      _RowNumber: 1,
      id: 'idstring',
      createdAt: new Date(n),
      updatedAt: new Date(n),
      title: 'Title',
      count: 21,
      timestamp: new Date(n),
      image: 'アプリ_Images/test.png',
      color: '赤',
      bgColor: 'blue'
    });
  });
  test('should throw invalid id error ', () => {
    const n = new Date().toUTCString();
    expect(() =>
      mappingCols(
        {
          _RowNumber: 1,
          id: 'id.string',
          createdAt: n,
          updatedAt: n,
          名前: 'file.md'
        },
        {
          cols: [
            {
              srcName: '名前',
              dstName: 'filename',
              colType: 'string'
            }
          ]
        }
      )
    ).toThrow(
      `mappingCols: invalid id: value = id.string, params = id, id, id`
    );
    expect(() =>
      mappingCols(
        {
          _RowNumber: 1,
          createdAt: n,
          updatedAt: n,
          名前: 'file.md'
        },
        {
          cols: [
            {
              srcName: '名前',
              dstName: 'filename',
              colType: 'string'
            }
          ]
        }
      )
    ).toThrow(
      `mappingCols: invalid id: value = undefined, params = id, id, id`
    );
    expect(() =>
      mappingCols(
        {
          _RowNumber: 1,
          id: 'idstring',
          createdAt: n,
          updatedAt: n,
          名前: 'file.md'
        },
        {
          cols: [
            {
              srcName: '名前',
              dstName: 'filename',
              colType: 'id'
            }
          ]
        }
      )
    ).toThrow(
      `mappingCols: invalid id: value = file.md, params = 名前, filename, id`
    );
  });
  test('should throw invalid type error ', () => {
    const n = new Date().toUTCString();
    expect(() =>
      mappingCols(
        {
          _RowNumber: 1,
          id: 'idstring',
          createdAt: n,
          updatedAt: n,
          回数: '21'
        },
        {
          cols: [
            {
              srcName: '回数',
              dstName: 'count',
              colType: 'number'
            }
          ]
        }
      )
    ).toThrow(
      `mappingCols: invalid type: actually type = string, params = 回数, count, number`
    );
  });
  test('should skip no exist cols', () => {
    const n = new Date().toUTCString();
    expect(
      mappingCols(
        {
          _RowNumber: 1,
          id: 'idstring',
          createdAt: n,
          updatedAt: n,
          回数: 21
        },
        {
          cols: [
            {
              srcName: 'タイトル',
              dstName: 'title',
              colType: 'string'
            },
            {
              srcName: '回数',
              dstName: 'count',
              colType: 'number'
            }
          ]
        }
      )
    ).toEqual({
      _RowNumber: 1,
      id: 'idstring',
      createdAt: new Date(n),
      updatedAt: new Date(n),
      count: 21
    });
  });
});

describe('apiActionPath', () => {
  test('should return api path', () => {
    expect(apiActionPath('abc-123', 'テーブル', 'secret')).toEqual(
      'apps/abc-123/tables/%E3%83%86%E3%83%BC%E3%83%96%E3%83%AB/Action?ApplicationAccessKey=secret'
    );
  });
});

describe('apiActionBodyFind', () => {
  test('should return api body', () => {
    expect(apiActionBodyFind()).toEqual({
      Action: 'Find',
      Properties: {},
      Rows: []
    });
  });
});

describe('imageURL()', () => {
  test('should return iamge url by file name etc.', () => {
    expect(
      imageURL('abc-123', 'テーブル', 'テーブル_image/filename.jpg')
    ).toEqual(
      'https://www.appsheet.com/template/gettablefileurl?appName=abc-123&tableName=%E3%83%86%E3%83%BC%E3%83%96%E3%83%AB&fileName=%E3%83%86%E3%83%BC%E3%83%96%E3%83%AB_image%2Ffilename.jpg'
    );
  });
  test('should return blnak if fileName is blank', () => {
    expect(imageURL('abc-123', 'テーブル', '')).toEqual('');
  });
});

describe('client.find', () => {
  it('should call axios.post to get rows from AppSheet', async () => {
    const n = new Date().toUTCString();
    const res = client(
      'https://api.appsheet.com/api/v2/',
      'appId',
      'appName',
      'secret'
    ).find('tbl', {
      cols: [{ srcName: 'タイトル', dstName: 'title', colType: 'string' }]
    });
    expect(mockAxios.post).toHaveBeenLastCalledWith(
      `https://api.appsheet.com/api/v2/${apiActionPath(
        'appId',
        'tbl',
        'secret'
      )}`,
      '{"Action":"Find","Properties":{},"Rows":[]}',
      {
        headers: { 'Content-Type': ' application/json' }
      }
    );
    mockAxios.mockResponse({
      data: [
        {
          _RowNumber: 1,
          id: 'idstring1',
          createdAt: n,
          updatedAt: n,
          タイトル: 'Title1'
        },
        {
          _RowNumber: 2,
          id: 'idstring2',
          createdAt: n,
          updatedAt: n,
          タイトル: 'Title2'
        }
      ]
    });
    await expect(res).resolves.toEqual({
      rows: [
        {
          _RowNumber: 1,
          id: 'idstring1',
          createdAt: new Date(n),
          updatedAt: new Date(n),
          title: 'Title1'
        },
        {
          _RowNumber: 2,
          id: 'idstring2',
          createdAt: new Date(n),
          updatedAt: new Date(n),
          title: 'Title2'
        }
      ]
    });
  });
  it('should throw error empty data received', async () => {
    const n = new Date().toUTCString();
    const res = client(
      'https://api.appsheet.com/api/v2/',
      'appId',
      'appName',
      'secret'
    ).find('tbl', {
      cols: [{ srcName: 'タイトル', dstName: 'title', colType: 'string' }]
    });
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    mockAxios.mockResponse({
      data: ''
    });
    await expect(res).rejects.toThrow(
      'client.find API request error: table = tbl, empty data received'
    );
  });
  it('should throw error at api call failed', async () => {
    const n = new Date().toUTCString();
    const res = client(
      'https://api.appsheet.com/api/v2/',
      'appId',
      'appName',
      'secret'
    ).find('tbl', {
      cols: [{ srcName: 'タイトル', dstName: 'title', colType: 'string' }]
    });
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    mockAxios.mockError({ response: { status: 429, statusText: '429 error' } });
    await expect(res).rejects.toThrow(
      'client.find API request error: table = tbl, status = 429:429 error'
    );
  });
});

describe('client.saveImage', () => {
  it('should get image from AppShett and save to local file', async () => {
    const res = client(
      'https://api.appsheet.com/api/v2/',
      'appId',
      'appName',
      'secret'
    ).saveImage('tbl', 'アプリ_Image/image.jpg', '/path/to/static', true);
    expect(mockAxios.request).toHaveBeenLastCalledWith({
      method: 'get',
      url: imageURL('appName', 'tbl', 'アプリ_Image/image.jpg'),
      responseType: 'stream'
    });
    mockAxios.mockResponse({
      data: 'image data'
    });
    await expect(res).resolves.toEqual('/path/to/static/image.jpg');
    const { mockCreateWriteStream } = require('fs')._getMocks();
    expect(mockCreateWriteStream).toHaveBeenLastCalledWith(
      '/path/to/static/image.jpg'
    );
  });
  it('should get image by bare url', async () => {
    const res = client(
      'https://api.appsheet.com/api/v2/',
      'appId',
      '',
      'secret'
    ).saveImage(
      'tbl',
      'https://www.appsheet.com/template/gettablefileurl?appName=appName&tableName=tbl&fileName=アプリ_Image%2Fimage.jpg',
      '/path/to/static',
      false
    );
    expect(mockAxios.request).toHaveBeenLastCalledWith({
      method: 'get',
      url: 'https://www.appsheet.com/template/gettablefileurl?appName=appName&tableName=tbl&fileName=アプリ_Image%2Fimage.jpg',
      responseType: 'stream'
    });
    mockAxios.mockResponse({
      data: 'image data'
    });
    await expect(res).resolves.toEqual('/path/to/static/image.jpg');
    const { mockCreateWriteStream } = require('fs')._getMocks();
    expect(mockCreateWriteStream).toHaveBeenLastCalledWith(
      '/path/to/static/image.jpg'
    );
  });
  it('should return blank', async () => {
    const res = client(
      'https://api.appsheet.com/api/v2/',
      'appId',
      'appName',
      'secret'
    ).saveImage('tbl', '', '/path/to/static', true);
    expect(mockAxios.request).toHaveBeenCalledTimes(0);
    await expect(res).resolves.toEqual('');
  });
  it('should return blank wuth image-url', async () => {
    const res = client(
      'https://api.appsheet.com/api/v2/',
      'appId',
      'appName',
      'secret'
    ).saveImage(
      'tbl',
      'https://www.appsheet.com/template/gettablefileurl?appName=appName&tableName=tbl&fileName=',
      '/path/to/static',
      false
    );
    await expect(res).resolves.toEqual('');
  });
  it('should throw error by 404', async () => {
    const res = client(
      'https://api.appsheet.com/api/v2/',
      'appId',
      'appName',
      'secret'
    ).saveImage('tbl', 'アプリ_Image/image.jpg', '/path/to/static', true);
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    mockAxios.mockError({ response: { status: 404, statusText: '' } });
    await expect(res).rejects.toThrow(
      'client.saveImage error: table = tbl, status = 404:'
    );
  });
});
