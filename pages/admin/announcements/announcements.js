Page({
  data: {
    list: [],
    editingId: '',
    title: '',
    content: '',
    pin: false,
    isActive: true,
    saving: false,
  },

  onShow() {
    this.load()
  },

  async load() {
    try {
      const res = await wx.cloud.callFunction({ name: 'manageAnnouncements', data: { action: 'list' } })
      const r = (res && res.result) || {}
      if (!r.success) {
        throw new Error(r.message || '拉取列表失败')
      }
      this.setData({ list: r.list || [] })
    } catch (err) {
      console.error('announcement load error', err)
      wx.showToast({ title: '列表加载失败', icon: 'none' })
      this.setData({ list: [] })
    }
  },

  startAdd() {
    this.setData({ editingId: '', title: '', content: '', pin: false, isActive: true })
  },

  startEdit(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      editingId: item._id,
      title: item.title || '',
      content: item.content || '',
      pin: !!item.pin,
      isActive: item.isActive !== false,
    })
  },

  onTitle(e) {
    this.setData({ title: e.detail.value })
  },
  onContent(e) {
    this.setData({ content: e.detail.value })
  },
  onPin(e) {
    this.setData({ pin: e.detail.value })
  },
  onActive(e) {
    this.setData({ isActive: e.detail.value })
  },

  save() {
    const { editingId, title, content, pin, isActive } = this.data
    if (!title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' })
      return
    }
    if (!content.trim()) {
      wx.showToast({ title: '请填写内容', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    const action = editingId ? 'update' : 'create'
    const data = editingId
      ? { title: title.trim(), content: content.trim(), pin, isActive }
      : { title: title.trim(), content: content.trim(), pin, isActive }
    wx.cloud
      .callFunction({ name: 'manageAnnouncements', data: { action, id: editingId, data } })
      .then(() => {
        this.setData({ saving: false })
        this.startAdd()
        this.load()
        wx.showToast({ title: '已保存', icon: 'success' })
      })
      .catch((err) => {
        this.setData({ saving: false })
        console.error('announcement save error', err)
        const msg = (err && (err.errMsg || err.message)) || '保存失败'
        wx.showModal({ title: '保存失败', content: String(msg).slice(0, 300), showCancel: false })
      })
  },

  async toggle(e) {
    const { id, active } = e.currentTarget.dataset
    try {
      await wx.cloud.callFunction({ name: 'manageAnnouncements', data: { action: 'toggleActive', id, isActive: !active } })
      this.load()
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  remove(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除公告',
      content: '确定删除该公告？',
      success: async (r) => {
        if (!r.confirm) return
        wx.showLoading({ title: '删除' })
        try {
          await wx.cloud.callFunction({ name: 'manageAnnouncements', data: { action: 'delete', id } })
          wx.hideLoading()
          this.load()
        } catch (err) {
          wx.hideLoading()
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      },
    })
  },
})
