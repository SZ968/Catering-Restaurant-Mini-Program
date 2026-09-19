Component({
  properties: {
    dish: { type: Object, value: {} },
  },
  data: {
    isOff: false,
    offText: '',
    priceText: '0.00',
  },
  observers: {
    dish(d) {
      const status = (d && d.status) || 'on'
      const isOff = status === 'soldout' || status === 'off'
      const offText = status === 'soldout' ? '已售罄' : (status === 'off' ? '已下架' : '')
      this.setData({
        isOff,
        offText,
        priceText: Number(d.price || 0).toFixed(2),
      })
    },
  },
  methods: {
    onTap() {
      if (this.data.isOff) return
      const id = this.data.dish._id
      if (!id) return
      wx.navigateTo({ url: `/pages/dish-detail/dish-detail?id=${id}` })
    },
  },
})
