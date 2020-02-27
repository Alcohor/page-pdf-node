const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs')

class PagePdf {
  constructor(config) {
    config = config || {
      viewPortOption: {
        width: 794,
        height: 1000,
        deviceScaleFactor: 1,
      }
    }
    let {
      viewPortOption
    } = config;
    // 导出url
    this.exportUrl = null;
    // 是否页面主动通知页面渲染完毕
    this.hasPageNotify = null;
    // 浏览器实例
    this.browser = null;
    // 存储路径
    this.savePath = null;
    // 是否压缩
    this.needCompress = null;
    // 处理页面Dom的函数
    this.handleDomFunction = null;
    // 尝试次数
    this.tryCount = 3;
    // 超时时间
    this.exportWaitTimeout = 3 * 1000,
      // 重试间隔
      this.retryDelay = 1000,
      // 视口配置
      this.viewPortOption = viewPortOption,
      // 默认PDF配置
      this.defaultPdfOption = {
        printBackground: true, // 是否打印背景图 生涯页面中有一些图片 需要导出
        landscape: false, // 纸张方向： true-横向 false-纵向
        scale: 1, // 缩放比、
        format: 'A4', // 纸张大小
        pageRanges: '',
        displayHeaderFooter: false,
        headerTemplate: '',
        margin: {
          top: 0,
          bottom: '1cm'
        },
        footerTemplate: `
      <div style="-webkit-print-color-adjust: exact; color:#000; position: relative; bottom: -20px; font-size: 10px; height: 0.69cm; line-height: 0.5cm; width: 100%; text-align: center;">
        ·<span class='pageNumber' style="margin: 0 3px;user-select: none;"></span>·
      </div>`,
        margin: {
          top: '0',
          bottom: '0'
        }
      }
  }

  getInstance(config) {
    if (!this.instance) {
      this.instance = new PagePdf(config);
    }
    return this.instance;
  }
  // 根据路径创建文件夹
  creatFileByPath(path) {
    fs.mkdir(path, {
      recursive: true
    }, (err) => {
      if (err) throw err;
    });
  }

  // 检查传入的路径是否存在，不存在则创建
  checkPath(path) {
    const isExist = fs.existsSync(path)
    if (!isExist) this.creatFileByPath(path)
  }


  async destroy() {
    await this.browser.close();
    this.instance = null;
  }

  preprocess() {
    this.checkPath(this.savePath);
    this.pdfOption.path = `${this.savePath}/${this.fileName}${this.fileName.includes('.pdf') ? '' : '.pdf'}`
    const preTaskList = this.isNeedVerify ?
      [
        this.browserPage.setCookie(cookie),
        this.browserPage.setViewport(this.viewPortOption)
      ] :
      [
        this.browserPage.setViewport(this.viewPortOption)
      ]
    return new Promise((resolve, reject) => {
      Promise.all(preTaskList)
        .then(() => {
          resolve()
        })
        .catch(error => {
          reject(error)
        })
    })
  }

  waitPageNotify(url) {
    return new Promise(async (resolve, reject) => {
      try {
        this.targetUrl = url;
        await this.browserPage.exposeFunction(notifyFunctionName, pageData => {
          this.pageRenderDoneCallBack && this.pageRenderDoneCallBack(this, pageData)
          resolve();
        })
        await this.browserPage.goto(this.exportUrl)
      } catch (error) {
        reject(error)
      }
    })
  }

  async loadPage() {
    if (this.hasPageNotify) await this.waitPageNotify()
    else {
      await this.browserPage.goto(this.exportUrl, {
        waitUntil: ['networkidle0', 'load'],
        timeout: this.exportWaitTimeout
      })
      this.pageRenderDoneCallBack && this.pageRenderDoneCallBack()
    }
  }

  async printPageSingle() {
    if (!this.browser) this.browser = await puppeteer.launch();
    this.browserPage = await this.browser.newPage();
    await this.preprocess();
    await this.loadPage();
    this.handleDom && await this.handleDom(this.browserPage)
    await this.browserPage.pdf(this.pdfOption)
  }

  tryPrint() {
    let tryCount = this.tryCount;
    return new Promise((resolve, reject) => {
      const attemptFn = () => {
        this.printPageSingle()
          .then(() => resolve())
          .catch((error) => {
            if (tryCount) {
              tryCount--
              setTimeout(() => attemptFn(), this.retryDelay)
            } else {
              reject(error);
            }
          })
      }
      attemptFn()
    })
  }

  handlePrintConfig({
    url,
    fileName,
    absoluteSavePath,
    isNeedVerify,
    hasPageNotify = false,
    cookie,
    tryCount = 3,
    exportWaitTimeout = 3 * 1000,
    retryDelay = 1 * 1000,
    notifyFunctionName = 'notifyRenderDone',
    handleDomFunction,
    pageRenderDoneCallBack,
    pdfOption = this.defaultPdfOption
  }) {
    this.exportUrl = url;
    this.fileName = fileName;
    this.pdfOption = pdfOption;
    this.savePath = absoluteSavePath;
    this.isNeedVerify = isNeedVerify;
    this.hasPageNotify = hasPageNotify;
    this.cookie = cookie;
    this.tryCount = tryCount;
    this.exportWaitTimeout = exportWaitTimeout;
    this.retryDelay = retryDelay;
    this.notifyFunctionName = notifyFunctionName;
    this.pageRenderDoneCallBack = pageRenderDoneCallBack;
    this.handleDomFunction = handleDomFunction;
  }

  async print(printConfig) {
    this.handlePrintConfig(printConfig)
    await this.tryPrint()
  }
}
module.exports = PagePdf;