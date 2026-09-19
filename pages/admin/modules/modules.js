Page({
  data: {
    modules: [],
    saving: false,
  },

  onShow() {
    this.loadModules()
  },

  async loadModules() {
    try {
      const res = await wx.cloud.callFunction({ name: 'manageModules', data: { action: 'list' } })
      const list = (res.result && res.result.list) || []
      list.sort((a, b) => (a.sort || 0) - (b.sort || 0))
      this.setData({ modules: list })
    } catch (e) {
      console.error(e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 上移 / 下移：调整数组顺序后整体 reorder
  async move(e) {
    const { index, dir } = e.currentTarget.dataset
    const i = Number(index)
    const j = i + (dir === 'up' ? -1 : 1)
    if (j < 0 || j >= this.data.modules.length) return

    const arr = this.data.modules.slice()
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
    const orderedIds = arr.map((m) => m._id)

    wx.showLoading({ title: '保存中' })
    try {
      await wx.cloud.callFunction({
        name: 'manageModules',
        data: { action: 'reorder', orderedIds },
      })
      this.setData({ modules: arr })
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 显隐开关
  async toggle(e) {
    const { index } = e.currentTarget.dataset
    const m = this.data.modules[index]
    const visible = !m.visible
    const modules = this.data.modules.slice()
    modules[index].visible = visible
    this.setData({ modules })
    try {
      await wx.cloud.callFunction({
        name: 'manageModules',
        data: { action: 'toggle', id: m._id, visible },
      })
    } catch (err) {
      // 失败回滚
      modules[index].visible = !visible
      this.setData({ modules })
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 改名
  async rename(e) {
    const { index } = e.currentTarget.dataset
    const m = this.data.modules[index]
    const r = await wx.showModal({
      title: '修改模块名称',
      editable: true,
      placeholderText: '请输入名称',
      content: m.title || '',
    })
    if (!r.confirm) return
    const title = (r.content || '').trim()
    if (!title) return
    const modules = this.data.modules.slice()
    modules[index].title = title
    this.setData({ modules })
    try {
      await wx.cloud.callFunction({
        name: 'manageModules',
        data: { action: 'update', id: m._id, title },
      })
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  goBack() {
    wx.navigateBack()
  },
})
