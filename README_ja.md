# appsheet-to-nuxt-content

[AppSheet](https://www.appsheet.com/) のコンテンツを [nuxt-content](https://content.nuxtjs.org/) で利用するためにローカルへ保存する。

## AppSheet 側での設定

### API の有効化

- "Manage" / "Integrations" / "IN: from cloud services to your app"  を開く
- "Enable" をオンにする
- "Create Application Access Key" で Access Key を作成する

参考:
- [Enabling the API | AppSheet Help Center](https://help.appsheet.com/en/articles/1979976-enabling-the-api)
- [API: The Essentials | AppSheet Help Center](https://help.appsheet.com/en/articles/1979966-api-the-essentials)

### 画像表示の設定
(画像を扱うときのみ必要)

- "Security" / "Options" を開く
- "Require Image and File URL Signing" をオフにする

`--image-url` を指定しない場合は以下も必要。

- 画像 URL が格納される仮想カラムを作成する

参考: [Displaying Images and Documents | AppSheet Help Center](https://help.appsheet.com/en/articles/961605-displaying-images-and-documents)


## ローカル側での設定

### カラムのマップ情報

- `mapconfig.json(サンプル)`

```json
{
    "cols":[
        {
            "srcName": "タイトル",
            "dstName": "title",
            "colType": "string"
        },
        {
            "srcName": "画像",
            "dstName": "image",
            "colType": "image"
        }
    ]
}
```

### 環境変数

- `サンプル`

```
SHEET2CONTENT_API_BASE_URL=https://api.appsheet.com/api/v2/
SHEET2CONTENT_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx
SHEET2CONTENT_MAP_COLS=path/to/mapcols.json
SHEET2CONTENT_ACCESS_KEY=xx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx
```

`--image-url` を指定する場合は以下も必要。

```
SHEET2CONTENT_APP_NAME=<app name>-xxxxxxx
```

## コンテンツを保存

```bash
npx --package=@hankei6km/appsheet-to-nuxt-content -c \
  'sheet2content save <table name> <contents dir> <iamges dir>'
```

## API

### `client(apiBaseURL, appId, appName, accessKey)`

AppSheet 用のクライアントを作成する。

#### `apiBaseURL`

API エンドポイントの Base URL。

#### `appId`

API エンドポイント用の App Id。

#### `appName`

画像アダプター用の App Name(画像 URL 変換時に利用される)。

#### `accessKey`

API 用の Access Key。

#### returns

`Client`
 

### `saveRemoteContents(saveRemoteOptions)`

リモートのコンテンツを保存する。

#### `saveRemoteOptions.client`

AppSheet 用のクライアント。

#### `saveRemoteOptions.tableName`

保存するテーブルの名前。

##### `saveRemoteOptions.mapCols`

カラムのマップ情報。

##### `saveRemoteOptions.dstContentDir`
 
コンテンツを保存するディレクトリ。

##### `saveRemoteOptions.dstImagesDir`
 
画像を保存するディレクトリ。

##### `saveRemoteOptions.staticRoot`
 
画像パスをトリミングするための STATIC パスのルート。

##### `saveRemoteOptions.imageInfo`
 
画像の情報(size, meta) を取りだすす指定。

##### `saveRemoteOptions.imageURL`
 
画像を取得する URL を相対パスから生成する指定。

#### returns

`Promise<Error | null>`

## Known Issues

- 部分的なダウンロードはサポートされていません

## License

MIT License

Copyright (c) 2021 hankei6km

