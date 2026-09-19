const { ORDER_STATUS_TEXT, ORDER_TYPE_TEXT } = require('../../utils/config')
const { formatTime, requestPayment } = require('../../utils/util')

Page({
  data: {
    list: [],
    filtered: [],
    filter: 'all',
    filters: [
      { key: 'all', label: '全部' },
      { key: 'unpaid', label: '待支付' },
      { key: 'paid', label: '进行中' },
      { key: 'done', label: '已完成' },
    ],
    loading: true,
  },

  onShow() {
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({ name: 'getMyOrders', data: {} })
      const list = (res.result && res.result.orders) || []
      list.forEach((o) => {
        o.statusText = o.payMethod === 'offline' ? '到店付（已下单）' : (ORDER_STATUS_TEXT[o.status] || o.status)
        o.typeText = ORDER_TYPE_TEXT[o.type] || ''
        o.timeText = formatTime(o.createTime)
        o.totalText = Number(o.totalAmount).toFixed(2)
      })
      this.setData({ list, loading: false })
      this.applyFilter()
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.key })
    this.applyFilter()
  },

  applyFilter() {
    const f = this.data.filter
    let filtered = this.data.list
    if (f === 'unpaid') filtered = this.data.list.filter((o) => o.status === 'unpaid')
    else if (f === 'paid') filtered = this.data.list.filter((o) => o.status === 'paid' || o.status === 'preparing')
    else if (f === 'done') filtered = this.data.list.filter((o) => o.status === 'done' || o.status === 'canceled')
    this.setData({ filtered })
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/order/order?id=${e.currentTarget.dataset.id}` })
  },

  goMenu() {
    wx.switchTab({ url: '/pages/menu/menu' })
  },

  async payAgain(e) {
    const id = e.currentTarget.dataset.id
    const order = this.data.list.find((o) => o._id === id)
    if (order && order.payMethod === 'offline') return
    wx.showLoading({ title: '调起支付' })
    try {
      const res = await wx.cloud.callFunction({ name: 'createOrder', data: { orderId: id, repay: true } })
      const result = res.result
      if (!result || !result.success) {
        wx.hideLoading()
        return wx.showToast({ title: (result && result.message) || '失败', icon: 'none' })
      }
      await requestPayment(result.payParams)
      wx.hideLoading()
      this.load()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '支付失败', icon: 'none' })
    }
  },
})
