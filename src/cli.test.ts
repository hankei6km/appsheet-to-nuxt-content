import { PassThrough } from 'stream';
import cli from './cli';
import { SaveRemoteContentsOptions } from './lib/content';

jest.mock('./lib/content', () => {
  const mockSaveRemoteContents = jest.fn();
  const reset = () => {
    mockSaveRemoteContents.mockReset().mockResolvedValue(null);
    mockSaveRemoteContents
      .mockReset()
      .mockImplementation(
        async ({ dstContentsDir }: SaveRemoteContentsOptions) => {
          if (dstContentsDir.match(/error/)) {
            return new Error('dummy error');
          }
          return null;
        }
      );
  };
  reset();
  return {
    saveRemoteContents: mockSaveRemoteContents,
    _reset: reset,
    _getMocks: () => ({
      mockSaveRemoteContents
    })
  };
});

afterEach(() => {});

describe('cli()', () => {
  it('should return stdout with exitcode=0 from save command', async () => {
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    let outData = '';
    stdout.on('data', (d) => (outData = outData + d));
    let errData = '';
    stderr.on('data', (d) => (errData = errData + d));

    const res = cli({
      command: 'save',
      stdout,
      stderr,
      apiBaseURL: 'http://localhost:3000',
      appId: 'appid',
      appName: 'appname',
      mapCols: 'test/assets/mapcols.json',
      accessKey: 'secret',
      saveOpts: {
        tableName: 'tbl',
        dstContentsDir: '/contents/tbl',
        dstImagesDir: '/static/tbl',
        staticRoot: '/static',
        imageInfo: true
      }
    });
    expect(await res).toEqual(0);
    const { mockSaveRemoteContents } = require('./lib/content')._getMocks();
    expect(mockSaveRemoteContents.mock.calls[0]).toEqual([
      {
        client: expect.any(Object),
        tableName: 'tbl',
        mapCols: [
          {
            srcName: 'タイトル',
            dstName: 'title',
            colType: 'string'
          },
          {
            srcName: '画像',
            dstName: 'image',
            colType: 'image'
          }
        ],
        dstContentsDir: '/contents/tbl',
        dstImagesDir: '/static/tbl',
        staticRoot: '/static',
        imageInfo: true
      }
    ]);
    expect(outData).toEqual('');
    expect(errData).toEqual('');
  });
  it('should return stderr with exitcode=1 from save coomand', async () => {
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    let outData = '';
    stdout.on('data', (d) => (outData = outData + d));
    let errData = '';
    stderr.on('data', (d) => (errData = errData + d));

    const res = cli({
      command: 'save',
      stdout,
      stderr,
      apiBaseURL: 'http://localhost:3000',
      appId: 'appid',
      appName: 'appname',
      mapCols: 'test/assets/mapcols.json',
      accessKey: 'secret',
      saveOpts: {
        tableName: 'tbl',
        dstContentsDir: '/error',
        dstImagesDir: '/static/tbl',
        staticRoot: '/static',
        imageInfo: true
      }
    });
    expect(await res).toEqual(1);
    expect(outData).toEqual('');
    expect(errData).toEqual('Error: dummy error\n');
  });
});
