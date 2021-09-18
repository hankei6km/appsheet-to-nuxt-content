# appsheet-to-nuxt-content

[AppSheet](https://www.appsheet.com/) のコンテンツを [nuxt-content](https://content.nuxtjs.org/) で利用するために保存する。

## AppSheet 側での設定

### アプリの許可

- "Manage" / "Integrations" / "IN: from cloud services to your app"  を開く
- "Enable" をオンにする
- "Create Application Access Key" で Access Key を作成する

参考: [API: The Essentials | AppSheet Help Center](https://help.appsheet.com/en/articles/1979966-api-the-essentials)

### 画像の許可
(画像を扱うときのみ必要)

- "Security" / "Options" を開く
- "Require Image and File URL Signing" をオフにする

参考: [Displaying Images and Documents | AppSheet Help Center](https://help.appsheet.com/en/articles/961605-displaying-images-and-documents)


## ローカル側での設定

### カラムのマップ情報

- `mapcol.json(サンプル)`

```json
[
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
```

### 環境変数

- `サンプル`

```
SHEET2CONTENT_API_BASE_URL=https://api.appsheet.com/api/v2/
SHEET2CONTENT_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx
SHEET2CONTENT_APP_NAME=<app name>-xxxxxxx
SHEET2CONTENT_MAP_COLS=path/to/mapcols.json
SHEET2CONTENT_ACCESS_KEY=xx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx
```


## コンテンツを保存

```bash
npx --package=appsheet-to-nuxt-content -c \
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

画像アダプター用の App Name。

#### `accessKey`

API 用の Access Key。

#### returns

`Client`
 

### `saveRemoteContents(client, tableName, mapCols, dstContentDir, dstImagesDir)`

リモートのコンテンツを保存する。

#### `client`

AppSheet 用のクライアント。

#### `tableName`

保存するテーブルの名前。

##### `mapCols`

カラムのマップ情報。

##### `dstContentDir`
 
コンテンツを保存するディレクトリ。

##### `dstImagesDir`
 
画像を保存するディレクトリ。

#### returns

`Promise<Error | null>`


## License

MIT License

Copyright (c) 2021 hankei6km

