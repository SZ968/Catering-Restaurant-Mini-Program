Component({
  properties: {
    total: { type: Number, value: 0 },
    count: { type: Number, value: 0 },
    disabled: { type: Boolean, value: false },
    disabledText: { type: String, value: '未营业' },
  },
  data: {
    totalText: '0.00',
  },
  observers: {
    total(v) {
      this.setData({ totalText: Number(v || 0).toFixed(2) })
    },
  },
  methods: {
    onCheckout() {
      if (this.data.disabled) return
      this.triggerEvent('checkout')
    },
  },
})
