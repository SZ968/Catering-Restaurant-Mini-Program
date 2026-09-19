Component({
  properties: {
    value: { type: Number, value: 1 },
    min: { type: Number, value: 1 },
    max: { type: Number, value: 99 },
    disabled: { type: Boolean, value: false },
  },
  methods: {
    onMinus() {
      if (this.data.disabled) return
      const v = this.data.value - 1
      if (v < this.data.min) return
      this.triggerEvent('change', { value: v })
    },
    onPlus() {
      if (this.data.disabled) return
      const v = this.data.value + 1
      if (v > this.data.max) return
      this.triggerEvent('change', { value: v })
    },
  },
})
