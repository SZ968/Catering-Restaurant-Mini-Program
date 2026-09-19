const cart = require('../../utils/cart')
const { formatPrice } = require('../../utils/util')

Page({
  data: {
    items: [],
    total: '0.00',
    count: 0,
  },

  onShow() {
    this.refresh()
    this._unsub = cart.subscribe(() => this.refresh())
  },
  onHide() {
    if (this._unsub) { this._unsub(); this._unsub = null }
  },
  onUnload() {
    if (this._unsub) this._unsub()
  },

  refresh() {
    const items = cart.getCart()
    this.setData({ items, total: formatPrice(cart.getTotal()), count: cart.getCount() })
  },

  onQty(e) {
    cart.updateQuantity(e.currentTarget.dataset.key, e.detail.value)
  },
  onNote(e) {
    cart.updateNote(e.currentTarget.dataset.key, e.detail.value)
  },
  onRemove(e) {
    cart.removeItem(e.currentTarget.dataset.key)
  },
  clearAll() {
    wx.showModal({
      title: '清空购物车',
      content: '确定要清空当前购物车吗？',
      success: (r) => { if (r.confirm) cart.clear() },
    })
  },
  goCheckout() {
    if (this.data.count === 0) return
    wx.navigateTo({ url: '/pages/checkout/checkout' })
  },
})
