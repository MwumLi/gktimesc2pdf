#!/usr/bin/env node

const puppeteer = require("puppeteer-core");
const shell = require("shelljs");
const path = require("path");

const BROWSER_LAUNCH_CONFIG = {
  executablePath: '',
  ignoreHTTPSErrors: true,
  headless: true,
  devtools: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--ignore-certificate-errors"
  ]
}

const MERGE_FILENAME = 'merge.pdf'

const DEFAULT_CONFIG = {
  dir: "./pdf",
  merge: true,
  format: 'full' // 'full'/'number'/'title'
}

const argv = process.argv

if (argv.length < 2) {
  console.log('根据 Cookie 导出极客时间专栏为 PDF')
  console.log(`Usage: ${argv[0]} ${argv[1]} [jsonFile]`)
  console.log('jsonFile 默认为当前目录下的 pdf.json')
  process.exit(1)
}

const configFile = path.resolve(argv[2] || './pdf.json')
const config = loadConfig(configFile)
shell.mkdir("-p", path.join(config.dir, 'articles'));
const cookiesArr = getCookiesArr(config.cookies);

(async () => {
  // 获取专栏 intro
  const column = await getBookIntro();
  Object.assign(config, column)
  // 获取专栏目录
  const articles = await getBookMenuIds();
  // 启动浏览器
  const browser = await puppeteer.launch(BROWSER_LAUNCH_CONFIG);
  // 新建页面
  const page = await browser.newPage();
  // 设置 cookies 去认证
  if (cookiesArr) {
    await page.setCookie(...cookiesArr);
  }
  console.log("Load Cookies Success");
  // 根据文章列表，导出专栏文章
  console.log(`ToTal ${config.article_count} articles, 开始导出...`)
  await exportArticle(page, articles);
  // 合并专栏文章到一个 PDF
  if (config.merge) {
    console.log('开始合并')
    let mergeFilename = config.mergeFilename || `${config.column_title}.pdf` || MERGE_FILENAME
    mergeFilename = path.join(config.dir, mergeFilename)
    mergePdf(articles, mergeFilename);
    console.log('合并结束')
  }
  await browser.close();
  console.log("finish");
})();

function getBookIntro() {
  let url = "https://time.geekbang.org";
  const http = require("https");
  const postData = `{"cid": ${config.cid}}`;
  const options = {
    hostname: "time.geekbang.org",
    port: 443,
    path: "/serv/v1/column/intro",
    method: "POST",
    headers: {
      Referer: "https://time.geekbang.org",
      "Content-Type": "application/json",
      "Content-Length": postData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      res.setEncoding("utf8");
      let data = "";
      res.on("data", chunk => {
        data += chunk;
      });
      res.on("end", () => {
        data = JSON.parse(data).data;
        data = {
          column_title: data.column_title,
          article_count: data.article_count
        }
        resolve(data);
      });
    });

    req.on("error", e => {
      reject(e);
    });

    // write data to request body
    req.write(postData);
    req.end();
  });
}

function getBookMenuIds() {
  let url = "https://time.geekbang.org";
  const http = require("https");
  const size = config.article_count + 100
  const postData =
    `{"cid": ${config.cid},"size":${size},"prev":0,"order":"earliest","sample":false}`;
  const options = {
    hostname: "time.geekbang.org",
    port: 443,
    path: "/serv/v1/column/articles",
    method: "POST",
    headers: {
      Referer: "https://time.geekbang.org",
      "Content-Type": "application/json",
      "Content-Length": postData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      res.setEncoding("utf8");
      let data = "";
      res.on("data", chunk => {
        data += chunk;
      });
      res.on("end", () => {
        data = JSON.parse(data);
        data = data.data.list.map(item => {
          let name = item.article_title
          name = name.replace(/[：:|]/g, '-').replace(/[\s\/]/g, '').replace(/（/g, '(').replace(/）/g, ')')
          if (config.format === 'number') {
            name = name.split('-')[0]
          } else if (config.format === 'title') {
            name = name.split('-').slice(1).join('') || name
          }
          return {
            name: name,
            id: item.id
          };
        });
        resolve(data);
      });
    });

    req.on("error", e => {
      reject(e);
    });

    // write data to request body
    req.write(postData);
    req.end();
  });
}

async function exportArticle(page, articles) {
  for (let item of articles) {
    let url = `https://time.geekbang.org/column/article/${item.id}`;
    console.log(`[${item.name}]: 开始加载`);
    await page.goto(url, {
      waitUntil: "networkidle2"
    });
    console.log(`[${item.name}]: 开始导出`);
    item.path = path.join(config.dir, 'articles', `${item.name}.pdf`);
    await page.pdf({
      path: item.path
    });
    console.log(`[${item.name}]: 导出成功`);
  }
}

function mergePdf(pdfArr, output) {
  const HummusRecipe = require("hummus-recipe");
  const pdfDoc = new HummusRecipe("new", output);

  pdfArr.map(item => pdfDoc.appendPage(item.path));
  pdfDoc.endPDF();
}

function loadConfig(configFile) {
  let config = require(configFile)
  config = Object.assign({}, DEFAULT_CONFIG, config)
  if (!config.chrome) {
    console.warn("参数文件缺少 'chrome' 字段, 脚本需要此参数指定当前执行环境的 chrome 浏览器路径")
    process.exit(1)
  }
  BROWSER_LAUNCH_CONFIG.executablePath = config.chrome
  if (config.cid === undefined) {
    console.warn("参数文件缺少 'cid' 字段, 脚本需要此参数指定获取哪个专栏的内容")
    process.exit(1)
  }
  if (!config.cookies) {
    console.warn("参数文件缺少 'cookies' 字段, 脚本需要此参数进行认证, 导出的专栏文章可能不全")
  }
  config.dir = path.resolve(config.dir)
  return config
}

function getCookiesArr(cookieStr) {
  if (!cookieStr) return false
  let cookiesArr = [];
  cookieStr.split(";").map(item => {
    let arr = item.trim().split("=");
    let domain = ".time.geekbang.org";
    if (["_gid", "_gat", "GCID", "_ga", "GCESS"].includes(arr[0])) {
      domain = ".geekbang.org";
    }

    cookiesArr.push({
      name: arr[0],
      value: arr[1],
      domain: domain,
      path: "/"
    });
  });
  return cookiesArr;
}