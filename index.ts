const puppeteer = require('puppeteer')
class PagePdf {
  exportUrl: string;
  hasPageNotify: boolean;
  onPageLoaded: any;
  savePath: string;
  needCompress: boolean;
  private static instance: PagePdf;
  constructor(config: any) {
    let { url, hasPageNotify, onPageLoaded, absoluteSavePath } = config;
    // 导出url
    this.exportUrl = url;
    // 是否页面主动通知页面渲染完毕
    this.hasPageNotify = hasPageNotify;
    // 页面加载完毕时的回调
    this.onPageLoaded = onPageLoaded;
    // 存储路径
    this.savePath = absoluteSavePath;
    // 是否压缩
    this.needCompress = this.needCompress;
  }
  public static getInstance(config): PagePdf {
    if (!this.instance) {
      this.instance = new PagePdf(config);
    }
    return this.instance;
  }
}
module.exports = PagePdf;