const { getDB, COLLECTIONS } = require('../../../utils/cloud')

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

Page({
  data: {
    isOpen: true,
    allowDelivery: false,
    notice: '',
    hours: [],
  },

  onShow() {
    this.load()
  },

  async load() {
    const db = getDB()
    const res = await db.collection(COLLECTIONS.businessStatus).doc('singleton').get()
    const doc = res.data || {}
    const base = doc.dailyHours || []
    const hours = WEEK.map((name, wd) => {
      const h = base.find((x) => x.weekday === wd) || {}
      return {
        weekday: wd,
        name,
        openTime: h.openTime || '10:00',
        closeTime: h.closeTime || '22:00',
        isClosed: !!h.isClosed,
      }
    })
    this.setData({
      isOpen: !!doc.isOpen,
      allowDelivery: !!doc.allowDelivery,
      notice: doc.notice || '',
      hours,
    })
  },

  onToggleOpen(e) {
    this.setData({ isOpen: e.detail.value })
  },
  onToggleDelivery(e) {
    this.setData({ allowDelivery: e.detail.value })
  },
  onNotice(e) {
    this.setData({ notice: e.detail.value })
  },
  onTime(e) {
    const { idx, field } = e.currentTarget.dataset
    this.setData({ [`hours[${idx}].${field}`]: e.detail.value })
  },
  toggleClosed(e) {
    const idx = e.currentTarget.dataset.idx
    this.setData({ [`hours[${idx}].isClosed`]: !this.data.hours[idx].isClosed })
  },

  save() {
    wx.showLoading({ title: '保存' })
    wx.cloud
      .callFunction({
        name: 'manageHours',
        data: {
          action: 'update',
          data: {
            isOpen: this.data.isOpen,
            allowDelivery: this.data.allowDelivery,
            notice: this.data.notice,
            dailyHours: this.data.hours,
          },
        },
      })
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '已保存', icon: 'success' })
      })
      .catch(() => {
        wx.hideLoading()
        wx.showToast({ title: '保存失败', icon: 'none' })
      })
  },
})
