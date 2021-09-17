import {
  apiActionBodyFind,
  apiActionPath,
  imageURL,
  mappingCols
} from './appsheet';

describe('mappingCols', () => {
  test('should map cols', () => {
    const n = new Date().toUTCString();
    expect(
      mappingCols(
        {
          _RowNumber: 1,
          id: 'idstring',
          created: n,
          updated: n,
          タイトル: 'Title',
          回数: 21,
          タイムスタンプ: n,
          画像: 'アプリ_Images/test.png'
        },
        [
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
          }
        ]
      )
    ).toEqual({
      _RowNumber: 1,
      id: 'idstring',
      created: new Date(n),
      updated: new Date(n),
      title: 'Title',
      count: 21,
      timestamp: new Date(n),
      image: 'アプリ_Images/test.png'
    });
  });
  test('should throw type not match error', () => {
    const n = new Date().toUTCString();
    expect(() =>
      mappingCols(
        {
          _RowNumber: 1,
          id: 'idstring',
          created: n,
          updated: n,
          回数: '21'
        },
        [
          {
            srcName: '回数',
            dstName: 'count',
            colType: 'number'
          }
        ]
      )
    ).toThrow();
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
