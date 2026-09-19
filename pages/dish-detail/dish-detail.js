const menuSvc = require('../../services/menu')
const cart = require('../../utils/cart')
const { formatPrice } = require('../../utils/util')

Page({
  data: {
    dish: null,
    specs: [],
    specText: '',
    quantity: 1,
    note: '',
    priceText: '0.00',
  },

  onLoad(options) {
    if (options.id) this.loadDish(options.id)
  },

  async loadDish(id) {
    try {
      const dish = await menuSvc.getDish(id)
      const specs = dish.specs || []
      let specText = ''
      if (specs.length) specText = specs.map((s) => s.options[0]).join(' / ')
      this.setData({ dish, specs, priceText: formatPrice(dish.price), specText })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onSpecChange(e) {
    this.setData({ specText: e.detail.text })
  },

  onQtyChange(e) {
    this.setData({ quantity: e.detail.value })
  },

  onNote(e) {
    this.setData({ note: e.detail.value })
  },

  onAdd() {
    const dish = this.data.dish
    if (!dish) return
    if (dish.status !== 'on') {
      wx.showToast({ title: '该菜品暂不可点', icon: 'none' })
      return
    }
    cart.addItem(dish, this.data.quantity, this.data.specText, this.data.note)
    wx.showToast({ title: '已加入购物车', icon: 'success' })
  },
})
