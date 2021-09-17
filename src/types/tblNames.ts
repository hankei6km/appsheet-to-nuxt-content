// aspida の client.xxx の xxx 部分。
// 今回は api.vi[apiName]
// 手動で定義する必要があるので注意:
export const ApiNameArticleValues = ['pages', 'category', 'docs'] as const;
export type ApiNameArticle = typeof ApiNameArticleValues[number];
