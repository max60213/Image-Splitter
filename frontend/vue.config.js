const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  // 設定頁面標題
  pages: {
    index: {
      entry: 'src/main.js',
      title: 'Image Splitter',
    },
  }
})
