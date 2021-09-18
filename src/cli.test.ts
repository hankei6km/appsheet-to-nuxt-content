import { PassThrough } from 'stream';
import cli from './cli';
import { Client } from './lib/appsheet';
import { MapCols } from './types/appsheet';

jest.mock('./lib/content', () => {
  const mockSaveRemoteContents = jest.fn();
  const reset = () => {
    mockSaveRemoteContents.mockReset().mockResolvedValue(null);
    mockSaveRemoteContents
      .mockReset()
      .mockImplementation(
        async (
          client: Client,
          tableName: string,
          mapCols: MapCols,
          dstContentDir: string,
          dstImageDir: string
        ) => {
          if (dstContentDir.match(/error/)) {
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
  it('should return stdout with exitcode=0', async () => {
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    let outData = '';
    stdout.on('data', (d) => (outData = outData + d));
    let errData = '';
    stderr.on('data', (d) => (errData = errData + d));

    const res = cli({
      stdout,
      stderr,
      dstContentsDir: '/contents/tbl',
      dstImagesDir: '/static/tbl',
      apiBaseURL: 'http://localhost:3000',
      appId: 'appid',
      appName: 'appname',
      mapCols: 'test/assets/mapcols.json',
      tableName: 'tbl',
      accessKey: 'secret'
    });
    expect(await res).toEqual(0);
    const { mockSaveRemoteContents } = require('./lib/content')._getMocks();
    expect(mockSaveRemoteContents.mock.calls[0]).toEqual([
      expect.any(Object),
      'tbl',
      [
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
      '/contents/tbl',
      '/static/tbl'
    ]);
    expect(outData).toEqual('');
    expect(errData).toEqual('');
  });
  it('should return stderr with exitcode=1', async () => {
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    let outData = '';
    stdout.on('data', (d) => (outData = outData + d));
    let errData = '';
    stderr.on('data', (d) => (errData = errData + d));

    const res = cli({
      stdout,
      stderr,
      dstContentsDir: '/error',
      dstImagesDir: '/static/tbl',
      apiBaseURL: 'http://localhost:3000',
      appId: 'appid',
      appName: 'appname',
      mapCols: 'test/assets/mapcols.json',
      tableName: 'tbl',
      accessKey: 'secret'
    });
    expect(await res).toEqual(1);
    expect(outData).toEqual('');
    expect(errData).toEqual('Error: dummy error\n');
  });
});
