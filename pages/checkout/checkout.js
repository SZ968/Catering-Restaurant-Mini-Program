const cart = require('../../utils/cart')
const { formatPrice, requestPayment } = require('../../utils/util')
const { ENABLE_PAY } = require('../../utils/config')
const shopSvc = require('../../services/shop')

Page({
  data: {
    items: [],
    total: '0.00',
    remark: '',
    type: 'dineIn',
    types: [
      { key: 'dineIn', label: '堂食' },
      { key: 'takeout', label: '自提' },
      { key: 'delivery', label: '外卖' },
      { key: 'reserve', label: '预订' },
    ],
    allowDelivery: false,
    tableNo: '',
    pickupTime: '',
    reserveTime: '',
    personCount: '',
    addressName: '',
    addressPhone: '',
    addressDetail: '',
    submitting: false,
  },

  onLoad() {
    const items = cart.getCart()
    if (!items.length) {
      wx.showToast({ title: '购物车为空', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
      return
    }
    this.setData({ items, total: formatPrice(cart.getTotal()) })
    shopSvc.getBusinessStatus().then((s) => this.setData({ allowDelivery: s.allowDelivery }))
  },

  onType(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'delivery' && !this.data.allowDelivery) {
      wx.showToast({ title: '当前未开放外卖', icon: 'none' })
      return
    }
    this.setData({ type: key })
  },
  onRemark(e) {
    this.setData({ remark: e.detail.value })
  },
  onField(e) {
    const f = e.currentTarget.dataset.field
    this.setData({ [f]: e.detail.value })
  },

  async submit() {
    if (this.data.submitting) return
    const type = this.data.type
    const payload = {
      items: this.data.items.map((i) => ({
        dishId: i.dishId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        note: i.note,
        spec: i.spec,
      })),
      type,
      remark: this.data.remark,
      payLater: !ENABLE_PAY,
    }

    if (type === 'dineIn' && !this.data.tableNo) {
      return wx.showToast({ title: '请填写桌号', icon: 'none' })
    }
    if (type === 'takeout') {
      if (!this.data.pickupTime) return wx.showToast({ title: '请填写取餐时间', icon: 'none' })
      payload.pickupTime = this.data.pickupTime
    }
    if (type === 'delivery') {
      if (!this.data.allowDelivery) return wx.showToast({ title: '当前未开放外卖', icon: 'none' })
      if (!this.data.addressName || !this.data.addressPhone || !this.data.addressDetail) {
        return wx.showToast({ title: '请填写收货信息', icon: 'none' })
      }
      payload.address = {
        name: this.data.addressName,
        phone: this.data.addressPhone,
        detail: this.data.addressDetail,
      }
    }
    if (type === 'reserve') {
      if (!this.data.reserveTime || !this.data.personCount) {
        return wx.showToast({ title: '请填写到店时间与人数', icon: 'none' })
      }
      payload.reserveTime = this.data.reserveTime
      payload.personCount = Number(this.data.personCount)
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })
    try {
      const res = await wx.cloud.callFunction({ name: 'createOrder', data: payload })
      const result = res.result
      if (!result || !result.success) {
        wx.hideLoading()
        this.setData({ submitting: false })
        return wx.showToast({ title: (result && result.message) || '下单失败', icon: 'none' })
      }
      await requestPayment(result.payParams)
      cart.clear()
      wx.hideLoading()
      wx.redirectTo({ url: `/pages/order/order?id=${result.orderId}` })
    } catch (err) {
      wx.hideLoading()
      this.setData({ submitting: false })
      if (err && err.errMsg && err.errMsg.indexOf('cancel') >= 0) {
        wx.showToast({ title: '已取消支付', icon: 'none' })
      } else {
        wx.showToast({ title: '支付失败，请重试', icon: 'none' })
      }
    }
  },
})
