import { BaseCols } from '../types/appsheet';
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

jest.mock('./appsheet', () => {
  let mockClientFind = jest.fn();
  let mockClient = jest.fn();
  const reset = (rows: BaseCols[]) => {
    mockClientFind.mockReset().mockResolvedValue({ rows });
    mockClient.mockReset().mockImplementation(() => ({
      find: mockClientFind
    }));
  };
  reset([]);
  return {
    client: mockClient,
    _reset: reset,
    _getMocks: () => ({
      mockClient,
      mockClientFind
    })
  };
});

afterEach(() => {
  require('fs/promises')._reset();
  require('./appsheet')._reset();
});

describe('saveContentFile()', () => {
  it('should save text that is included frontmatter to a file', async () => {
    const res = saveContentFile(
      {
        _RowNumber: 1,
        id: 'idstring',
        created: new Date('2021-09-17T16:50:56.000Z'),
        updated: new Date('2021-09-17T17:50:56.000Z'),
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
        created: new Date(n),
        updated: new Date(n),
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
        created: new Date('2021-09-17T16:50:56.000Z'),
        updated: new Date('2021-09-17T17:50:56.000Z'),
        title: 'Title1',
        content: 'markdown1'
      },
      {
        _RowNumber: 2,
        id: 'idstring2',
        created: new Date('2022-09-27T26:50:56.000Z'),
        updated: new Date('2022-09-27T27:50:56.000Z'),
        title: 'Title2',
        content: 'markdown2'
      }
    ]);
    const client = require('./appsheet')._getMocks().mockClient();
    const res = saveRemoteContents(
      client,
      'tbl',
      [],
      '/path/content',
      '/path/static'
    );
    await expect(res).resolves.toEqual(null);
    const { mockClientFind } = require('./appsheet')._getMocks();
    expect(mockClientFind.mock.calls[0]).toEqual(['tbl', []]);
    const { mockWriteFile } = require('fs/promises')._getMocks();
    expect(mockWriteFile.mock.calls[0][0]).toEqual(
      '/path/content/idstring1.md'
    );
    expect(mockWriteFile.mock.calls[0][1]).toContain('title: Title1');
    expect(mockWriteFile.mock.calls[0][1]).toContain('position: 0');
    expect(mockWriteFile.mock.calls[0][1]).toContain('markdown1');
    expect(mockWriteFile.mock.calls[1][0]).toEqual(
      '/path/content/idstring2.md'
    );
    expect(mockWriteFile.mock.calls[1][1]).toContain('title: Title2');
    expect(mockWriteFile.mock.calls[1][1]).toContain('position: 1');
    expect(mockWriteFile.mock.calls[1][1]).toContain('markdown2');
  });
  it('should return error', async () => {
    require('./appsheet')._reset([
      {
        _RowNumber: 1,
        id: 'idstring1',
        created: new Date('2021-09-17T16:50:56.000Z'),
        updated: new Date('2021-09-17T17:50:56.000Z')
      }
    ]);
    const client = require('./appsheet')._getMocks().mockClient();
    const res = saveRemoteContents(client, 'tbl', [], '/error', '/path/static');
    expect(String(await res)).toMatch(/dummy error/);
  });
});