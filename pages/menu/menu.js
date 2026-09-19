const { PHONES } = require('../../utils/config')
const menuSvc = require('../../services/menu')
const shopSvc = require('../../services/shop')
const cart = require('../../utils/cart')

Page({
  data: {
    categories: [],
    activeId: '',
    allDishes: [],
    dishes: [],
    dishCountInCategory: 0,
    isOpen: true,
    cartCount: 0,
    cartTotal: 0,
    phones: PHONES,
  },

  onLoad() {
    this.loadCategories().then(() => this.loadDishes())
    this.loadStatus()
    this._dWatcher = menuSvc.watchDishes(() => this.loadDishes())
    this._bWatcher = shopSvc.watchBusinessStatus(() => this.loadStatus())
    this._unsub = cart.subscribe(() => {
      this.setData({ cartCount: cart.getCount(), cartTotal: cart.getTotal() })
    })
    this.setData({ cartCount: cart.getCount(), cartTotal: cart.getTotal() })
  },

  onUnload() {
    if (this._dWatcher && this._dWatcher.close) this._dWatcher.close()
    if (this._bWatcher && this._bWatcher.close) this._bWatcher.close()
    if (this._unsub) this._unsub()
  },

  async loadCategories() {
    const cats = await menuSvc.getCategories()
    this.setData({ categories: cats, activeId: cats.length ? cats[0]._id : '' })
  },

  async loadDishes() {
    try {
      // 关键：微信小程序端直连数据库查询，单次 limit 上限仅 20 条（被微信硬性限制）。
      // 因此用分页循环取出全部菜品（92 道约需 5 次），避免只取到前 20 道。
      const db = wx.cloud.database()
      const PAGE = 20
      let all = []
      let skip = 0
      while (true) {
        const res = await db
          .collection('res_dishes')
          .where({ status: 'on' })
          .orderBy('sort', 'asc')
          .limit(PAGE)
          .skip(skip)
          .get()
        const list = res.data || []
        all = all.concat(list)
        if (list.length < PAGE) break // 返回不足一页，说明已取完
        skip += PAGE
      }

      const activeId = this.data.activeId
      const dishes = activeId ? all.filter((d) => d.categoryId === activeId) : all
      this.setData({
        allDishes: all,
        dishes,
        dishCountInCategory: dishes.length,
      })
    } catch (err) {
      console.error('loadDishes error', err)
    }
  },

  onCategoryChange(e) {
    const id = e.detail.id
    const dishes = this.data.allDishes.filter((d) => d.categoryId === id)
    this.setData({
      activeId: id,
      dishes,
      dishCountInCategory: dishes.length,
    })
  },

  async loadStatus() {
    try {
      const s = await shopSvc.getBusinessStatus()
      this.setData({ isOpen: s.isOpen })
    } catch (err) {
      console.error(err)
    }
  },

  onCheckout() {
    if (!this.data.isOpen) {
      wx.showToast({ title: '店铺休息中，暂不接受下单', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/checkout/checkout' })
  },
})
