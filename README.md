# gktimesc2pdf

导出极客时间专栏为 pdf

[极客时间](https://time.geekbang.org/) 推出的专栏挺不错的  
为了便于购买后，可以离线观看，因此写了这个脚本

纯属玩乐! ^V^

> 很遗憾的是没找到很方便给 pdf 增加书签的方法，以至于合并后的 pdf 不能很好的导航相应文章  
> 如果你知道某种方便程序化地给 pdf 加书签的方法，请告诉我，感激不尽!😃

## 使用

当前工作目录下的 `pdf.json` 为参数文件:

    $ npx github:MwumLi/gktimesc2pdf gktimesc2pdf

指定参数文件:

    $ npx github:MwumLi/gktimesc2pdf gktimesc2pdf export.json

## 参数文件

参考: [pdf.json](./pdf.json)

```
{
  "chrome": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "cid": "48",
  "format": "title",
  "mergeFilename": "左耳听风.pdf",
  "cookies": "ga=GA1.2.1178127592.1541215352; GCID=1ceb628-98afd55-c9f03e8-6b5ff79; _gid=GA1.2.1933634052.1542027558; _gat=1; GCESS=BAsCBAABBNhxEwAJAQEHBIijGgkMAQEFBAAAAAAEBIBRAQADBF4e7FsGBAdj_.cCBF4e7FsKBAAAAAAIAQM-; Hm_lvt_022f847c4e3acd44d4a2481d9187f1e6=1542027557,1542032153,1542032313,1542200928; SERVERID=97796d411bb56cf20a5612997f113254|1542200937|1542200893; Hm_lpvt_022f847c4e3acd44d4a2481d9187f1e6=1542200938"
}
```

- `chrome`: 当前运行环境的 chrome 浏览器
- `cid`: 下载的专栏 id
- `format`: 默认为 `"full"`，指定导出的 pdf 文件名格式

  - `"full"`: 默认, 包含编号和名称, 例如 `03-程序员如何用技术变现(上).pdf`
  - `"number"`: 只有编号, 例如 `03.pdf`
  - `"title"`: 只有标题, 例如 `程序员如何用技术变现(上).pdf`

- `merge`: 默认为 true, 是否合并专栏的所有文章为一个 pdf
- `mergeFilename`: 合并后的文件名称, 默认为 `merge.pdf`
- `cookies`: 你登录后的请求 cookie
