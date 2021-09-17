export type APIActionBody = {
  Action: 'Find';
  Properties: any;
  Rows: any[];
};

export type BaseCols = {
  _RowNumber: number;
  id: string;
  created: Date;
  updated: Date;
} & Record<string, any>;

export type MapCols = {
  srcName: string;
  dstName: string;
  colType: 'id' | 'number' | 'string' | 'datetime' | 'image'; // 独自の定義(AppSheet 側の型ではない).
}[];

export type FindResult = {
  rows: (BaseCols & Record<string, any>)[];
};
