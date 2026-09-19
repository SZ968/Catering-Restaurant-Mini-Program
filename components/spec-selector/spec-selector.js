Component({
  properties: {
    specs: { type: Array, value: [] }, // [{ label, options:[...] }]
  },
  data: {
    selected: {},
  },
  observers: {
    specs(list) {
      const selected = {}
      ;(list || []).forEach((s) => {
        selected[s.label] = s.options[0]
      })
      this.setData({ selected })
      this.emit(selected)
    },
  },
  methods: {
    onSelect(e) {
      const { label, option } = e.currentTarget.dataset
      const selected = Object.assign({}, this.data.selected, { [label]: option })
      this.setData({ selected })
      this.emit(selected)
    },
    emit(selected) {
      const text = Object.keys(selected).map((k) => selected[k]).join(' / ')
      this.triggerEvent('change', { selected, text })
    },
  },
})
