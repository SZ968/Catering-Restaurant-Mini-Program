const adminSvc = require('../../../services/admin')

Page({
  data: {
    checking: true,
    isAdmin: false,
    openid: '',
  },

  onLoad() {
    this.check()
  },

  async check() {
    try {
      const res = await wx.cloud.callFunction({ name: 'checkAdmin', data: {} })
      const r = res.result || {}
      this.setData({ checking: false, isAdmin: !!r.isAdmin, openid: r.openid || '' })
      if (r.isAdmin) {
        setTimeout(() => wx.redirectTo({ url: '/pages/admin/index/index' }), 200)
      }
    } catch (e) {
      this.setData({ checking: false })
    }
  },

  async apply() {
    wx.showLoading({ title: '申请中' })
    try {
      const r = await adminSvc.manageAdmins('apply', {})
      wx.hideLoading()
      if (r.success && r.isAdmin) {
        wx.redirectTo({ url: '/pages/admin/index/index' })
      } else if (r.success && r.applied) {
        wx.showToast({ title: '已提交，待店主审核', icon: 'none' })
      } else {
        wx.showToast({ title: r.message || '申请失败', icon: 'none' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '申请失败', icon: 'none' })
    }
  },

  copyOpenid() {
    if (!this.data.openid) return
    wx.setClipboardData({
      data: this.data.openid,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    })
  },
})
