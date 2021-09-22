import path from 'path';
import { resolve } from 'path/posix';
import { BaseCols, MapCols } from '../types/appsheet';
import { saveContentFile, saveRemoteContents } from './content';

// import { getAllPagesIds, getPagesData } from './pages';

jest.mock('fs/promises', () => {
  const mockWriteFileFn = async (pathName: string) => {
    if (pathName.match(/error/)) {
      throw new Error('dummy error');
    }
    return null;
  };
  let mockWriteFile = jest.fn();
  const reset = () => {
    mockWriteFile.mockReset().mockImplementation(mockWriteFileFn);
  };
  reset();
  return {
    writeFile: mockWriteFile,
    _reset: reset,
    _getMocks: () => ({
      mockWriteFile
    })
  };
});

jest.mock('image-size', () => {
  const mockSizeOfFn = async (pathName: string) => {
    if (pathName.match(/error/)) {
      throw new Error('dummy error');
    }
    return { width: 200, height: 100 };
  };
  let mockSizeOf = jest.fn();
  const reset = () => {
    mockSizeOf.mockReset().mockImplementation(mockSizeOfFn);
  };
  reset();
  return {
    // https://remarkablemark.org/blog/2018/06/28/jest-mock-default-named-export/
    __esModule: true,
    default: mockSizeOf,
    sizeOf: mockSizeOf,
    _reset: reset,
    _getMocks: () => ({
      mockSizeOf
    })
  };
});

jest.mock('./appsheet', () => {
  let mockClientFind = jest.fn();
  let mockClientSaveImage = jest.fn();
  let mockClient = jest.fn();
  const reset = (rows: BaseCols[]) => {
    mockClientFind.mockReset().mockResolvedValue({ rows });
    mockClientSaveImage
      .mockReset()
      .mockImplementation(
        async (
          tableName: string,
          src: string,
          dstDir: string
        ): Promise<string> => {
          return new Promise((resolve) => {
            process.nextTick(() =>
              resolve(path.join(dstDir, path.basename(src)))
            );
          });
        }
      );
    mockClient.mockReset().mockImplementation(() => ({
      find: mockClientFind,
      saveImage: mockClientSaveImage
    }));
  };
  reset([]);
  return {
    client: mockClient,
    _reset: reset,
    _getMocks: () => ({
      mockClient,
      mockClientFind,
      mockClientSaveImage
    })
  };
});

afterEach(() => {
  require('fs/promises')._reset();
  require('image-size')._reset();
  require('./appsheet')._reset();
});

describe('saveContentFile()', () => {
  it('should save text that is included frontmatter to a file', async () => {
    const res = saveContentFile(
      {
        _RowNumber: 1,
        id: 'idstring',
        createdAt: new Date('2021-09-17T16:50:56.000Z'),
        updatedAt: new Date('2021-09-17T17:50:56.000Z'),
        title: 'Title',
        content: 'markdown'
      },
      [],
      '/path',
      0
    );
    await expect(res).resolves.toEqual(null);
    const { mockWriteFile } = require('fs/promises')._getMocks();
    expect(mockWriteFile).toHaveBeenLastCalledWith(
      '/path/idstring.md',
      `---
_RowNumber: 1
id: idstring
createdAt: 2021-09-17T16:50:56.000Z
updatedAt: 2021-09-17T17:50:56.000Z
title: Title
position: 0
---
markdown
`
    );
  });
  it('should return error', async () => {
    const n = new Date().toUTCString();
    const res = saveContentFile(
      {
        _RowNumber: 1,
        id: 'idstring',
        createdAt: new Date(n),
        updatedAt: new Date(n),
        title: 'Title',
        count: 21,
        timestamp: new Date(n),
        image: 'アプリ_Images/test.png'
      },
      [],
      '/path/error',
      0
    );
    expect(String(await res)).toMatch(/dummy error/);
  });
});

describe('saveRemoteContents()', () => {
  it('should get remote content and save as local files', async () => {
    require('./appsheet')._reset([
      {
        _RowNumber: 1,
        id: 'idstring1',
        createdAt: new Date('2021-09-17T16:50:56.000Z'),
        updatedAt: new Date('2021-09-17T17:50:56.000Z'),
        title: 'Title1',
        image: 'アプリ_Images/test1.png',
        content: 'markdown1'
      },
      {
        _RowNumber: 2,
        id: 'idstring2',
        createdAt: new Date('2022-09-27T16:50:56.000Z'),
        updatedAt: new Date('2022-09-27T17:50:56.000Z'),
        title: 'Title2',
        image: 'アプリ_Images/test2.png',
        content: 'markdown2'
      }
    ]);
    const client = require('./appsheet')._getMocks().mockClient();
    const mapCols: MapCols = [
      { srcName: 'タイトル', dstName: 'title', colType: 'string' },
      { srcName: '画像', dstName: 'image', colType: 'image' }
    ];
    const res = saveRemoteContents(
      client,
      'tbl',
      mapCols,
      '/path/content',
      '/path/static/images',
      '/path/static'
    );
    await expect(res).resolves.toEqual(null);
    const { mockClientFind, mockClientSaveImage } =
      require('./appsheet')._getMocks();
    expect(mockClientFind.mock.calls[0]).toEqual(['tbl', mapCols]);
    expect(mockClientSaveImage.mock.calls[0]).toEqual([
      'tbl',
      'アプリ_Images/test1.png',
      '/path/static/images'
    ]);
    expect(mockClientSaveImage.mock.calls[1]).toEqual([
      'tbl',
      'アプリ_Images/test2.png',
      '/path/static/images'
    ]);
    const { mockWriteFile } = require('fs/promises')._getMocks();
    expect(mockWriteFile.mock.calls[0][0]).toEqual(
      '/path/content/idstring1.md'
    );
    expect(mockWriteFile.mock.calls[0][1]).toContain('title: Title1');
    expect(mockWriteFile.mock.calls[0][1]).toContain('url: /images/test1.png');
    expect(mockWriteFile.mock.calls[0][1]).toContain('width: 200');
    expect(mockWriteFile.mock.calls[0][1]).toContain('height: 100');
    expect(mockWriteFile.mock.calls[0][1]).toContain('position: 0');
    expect(mockWriteFile.mock.calls[0][1]).toContain('markdown1');
    expect(mockWriteFile.mock.calls[1][0]).toEqual(
      '/path/content/idstring2.md'
    );
    expect(mockWriteFile.mock.calls[1][1]).toContain('title: Title2');
    expect(mockWriteFile.mock.calls[1][1]).toContain('url: /images/test2.png');
    expect(mockWriteFile.mock.calls[0][1]).toContain('width: 200');
    expect(mockWriteFile.mock.calls[0][1]).toContain('height: 100');
    expect(mockWriteFile.mock.calls[1][1]).toContain('position: 1');
    expect(mockWriteFile.mock.calls[1][1]).toContain('markdown2');
  });
  it('should return error', async () => {
    require('./appsheet')._reset([
      {
        _RowNumber: 1,
        id: 'idstring1',
        createdAt: new Date('2021-09-17T16:50:56.000Z'),
        updatedAt: new Date('2021-09-17T17:50:56.000Z')
      }
    ]);
    const client = require('./appsheet')._getMocks().mockClient();
    const res = saveRemoteContents(
      client,
      'tbl',
      [],
      '/error',
      '/path/static/images',
      '/path/static'
    );
    expect(String(await res)).toMatch(/dummy error/);
  });
});
