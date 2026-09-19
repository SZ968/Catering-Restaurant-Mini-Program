const { ENV_ID } = require('./utils/config')

// 全局应用入口：初始化云开发、预拉取店铺信息
App({
  globalData: {
    env: ENV_ID,
    openid: '',
    shopInfo: null,        // 店铺信息（含电话、地址、经纬度、头图）
    businessStatus: null,  // 营业状态单文档
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库版本过低，请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: ENV_ID,
      traceUser: true,
    })
  },
})
