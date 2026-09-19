const { ORDER_STATUS_TEXT, ORDER_TYPE_TEXT, PHONES } = require('../../utils/config')
const { formatTime, requestPayment } = require('../../utils/util')

Page({
  data: {
    order: null,
    logs: [],
  },

  onLoad(options) {
    if (options.id) this.load(options.id)
  },

  async load(id) {
    wx.showLoading({ title: '加载中' })
    try {
      const res = await wx.cloud.callFunction({ name: 'queryOrder', data: { orderId: id } })
      const order = (res.result && res.result.order) || null
      if (!order) {
        wx.hideLoading()
        wx.showToast({ title: '订单不存在', icon: 'none' })
        return
      }
      order.totalText = Number(order.totalAmount).toFixed(2)
      order.timeText = formatTime(order.createTime)
      order.typeText = ORDER_TYPE_TEXT[order.type] || ''
      order.statusText =
        order.payMethod === 'offline' ? '到店付（已下单）' : (ORDER_STATUS_TEXT[order.status] || '')
      this.setData({ order, logs: this.buildLogs(order) })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  },

  buildLogs(order) {
    const canceled = order.status === 'canceled'
    const steps = [
      { label: '提交订单', time: formatTime(order.createTime), done: true },
      {
        label: order.payMethod === 'offline' ? '到店付款' : '微信支付',
        time: order.payTime ? formatTime(order.payTime) : '',
        done: order.payMethod === 'offline' ? order.status === 'done' : (order.status !== 'unpaid' && !canceled),
      },
      {
        label: '商家备餐',
        time: '',
        done: (order.status === 'preparing' || order.status === 'done') && !canceled,
      },
      {
        label: '订单完成',
        time: order.updateTime ? formatTime(order.updateTime) : '',
        done: order.status === 'done',
      },
    ]
    return steps
  },

  async pay() {
    if (this.data.order.payMethod === 'offline') return
    const id = this.data.order._id
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
      this.load(id)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '支付失败', icon: 'none' })
    }
  },

  callShop() {
    if (PHONES && PHONES.length) {
      wx.makePhoneCall({ phoneNumber: String(PHONES[0]) })
    }
  },
})
