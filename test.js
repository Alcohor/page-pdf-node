const PageToPdf = require('./index');
const path = require('path')

const pageToPdf = new PageToPdf();
const printConfig = {
  url : 'http://www.taobao.com',
  fileName: 'taobao.pdf',
  absoluteSavePath: path.resolve(__dirname, './')
}
pageToPdf.print(printConfig)