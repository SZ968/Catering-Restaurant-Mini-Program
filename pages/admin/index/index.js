Page({
  data: {
    stats: { bannerCount: 0, announcementCount: 0, moduleCount: 0, statusText: '营业中' },
    menus: [
      { label: '轮播图管理', url: '/pages/admin/banners/banners', ico: '图' },
      { label: '公告管理', url: '/pages/admin/announcements/announcements', ico: '公' },
      { label: '首页模块', url: '/pages/admin/modules/modules', ico: '模' },
      { label: '营业配置', url: '/pages/admin/hours/hours', ico: '营' },
      { label: '管理员', url: '/pages/admin/admins/admins', ico: '管' },
      { label: '顾客端', url: 'customer', ico: '客' },
    ],
  },

  onShow() {
    this.loadStats()
  },

  async loadStats() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getAdminStats', data: {} })
      const s = (res.result && res.result.stats) || {}
      this.setData({
        stats: {
          bannerCount: s.bannerCount || 0,
          announcementCount: s.announcementCount || 0,
          moduleCount: s.moduleCount || 0,
          statusText: s.statusText || '营业中',
        },
      })
    } catch (e) {
      console.error(e)
    }
  },

  go(e) {
    const url = e.currentTarget.dataset.url
    if (url === 'customer') {
      wx.reLaunch({ url: '/pages/index/index' })
    } else {
      wx.navigateTo({ url })
    }
  },
})
