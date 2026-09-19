const adminSvc = require('../../../services/admin')

Page({
  data: {
    admins: [],
    applications: [],
    loading: true,
  },

  onShow() {
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const r = await adminSvc.manageAdmins('list', {})
      if (r.success) {
        this.setData({
          admins: r.admins || [],
          applications: r.applications || [],
        })
      } else {
        wx.showToast({ title: r.message || '无权限', icon: 'none' })
      }
    } catch (e) {
      console.error(e)
    } finally {
      this.setData({ loading: false })
    }
  },

  async approve(e) {
    const { openid, name } = e.currentTarget.dataset
    wx.showLoading({ title: '处理中' })
    try {
      const r = await adminSvc.manageAdmins('approve', { openid, name })
      wx.hideLoading()
      if (r.success) {
        wx.showToast({ title: '已通过', icon: 'success' })
        this.load()
      } else {
        wx.showToast({ title: r.message || '失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '失败', icon: 'none' })
    }
  },

  remove(e) {
    const { openid } = e.currentTarget.dataset
    wx.showModal({
      title: '确认移除',
      content: '移除后该管理员将无法进入后台',
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '处理中' })
        try {
          const r = await adminSvc.manageAdmins('remove', { openid })
          wx.hideLoading()
          if (r.success) {
            wx.showToast({ title: '已移除', icon: 'success' })
            this.load()
          } else {
            wx.showToast({ title: r.message || '失败', icon: 'none' })
          }
        } catch (err) {
          wx.hideLoading()
          wx.showToast({ title: '失败', icon: 'none' })
        }
      },
    })
  },
})
