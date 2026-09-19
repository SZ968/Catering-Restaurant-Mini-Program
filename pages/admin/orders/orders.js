const { ORDER_STATUS_TEXT, ORDER_TYPE_TEXT } = require('../../../utils/config')
const { formatTime } = require('../../../utils/util')

Page({
  data: {
    list: [],
    filtered: [],
    filter: 'all',
    filters: [
      { key: 'all', label: '全部' },
      { key: 'active', label: '进行中' },
      { key: 'done', label: '已完成' },
      { key: 'canceled', label: '已取消' },
    ],
  },

  onShow() {
    this.load()
  },

  async load() {
    wx.showLoading({ title: '加载' })
    try {
      const res = await wx.cloud.callFunction({ name: 'getAdminOrders', data: {} })
      wx.hideLoading()
      const list = (res.result && res.result.orders) || []
      list.forEach((o) => {
        o.statusText = ORDER_STATUS_TEXT[o.status] || o.status
        o.typeText = ORDER_TYPE_TEXT[o.type] || ''
        o.timeText = formatTime(o.createTime)
        o.totalText = Number(o.totalAmount).toFixed(2)
      })
      this.setData({ list })
      this.applyFilter()
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.key })
    this.applyFilter()
  },

  applyFilter() {
    const f = this.data.filter
    let arr = this.data.list
    if (f === 'active') arr = this.data.list.filter((o) => ['unpaid', 'paid', 'preparing'].includes(o.status))
    else if (f === 'done') arr = this.data.list.filter((o) => o.status === 'done')
    else if (f === 'canceled') arr = this.data.list.filter((o) => o.status === 'canceled')
    this.setData({ filtered: arr })
  },

  async update(e) {
    const { id, status } = e.currentTarget.dataset
    wx.showLoading({ title: '处理中' })
    try {
      await wx.cloud.callFunction({ name: 'updateOrderStatus', data: { orderId: id, status } })
      wx.hideLoading()
      this.load()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  preview(e) {
    wx.navigateTo({ url: `/pages/order/order?id=${e.currentTarget.dataset.id}` })
  },
})
