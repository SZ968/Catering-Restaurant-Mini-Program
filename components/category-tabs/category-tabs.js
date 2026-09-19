Component({
  properties: {
    categories: { type: Array, value: [] },
    activeId: { type: String, value: '' },
  },
  methods: {
    onTap(e) {
      const id = e.currentTarget.dataset.id
      if (id === this.data.activeId) return
      this.triggerEvent('change', { id })
    },
  },
})
