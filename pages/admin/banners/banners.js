Page({
  data: {
    list: [],
    uploading: false,
    title: '',
  },

  onShow() {
    this.load()
  },

  async load() {
    try {
      const res = await wx.cloud.callFunction({ name: 'manageBanners', data: { action: 'list' } })
      const r = (res && res.result) || {}
      if (!r.success) {
        throw new Error(r.message || '拉取列表失败')
      }
      this.setData({ list: r.list || [] })
    } catch (err) {
      console.error('banner load error', err)
      wx.showToast({ title: '列表加载失败', icon: 'none' })
      this.setData({ list: [] })
    }
  },

  onTitle(e) {
    this.setData({ title: e.detail.value })
  },

  async upload() {
    let res
    try {
      res = await wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'] })
    } catch (e) {
      return // 用户取消选择
    }
    const file = res.tempFiles[0].tempFilePath
    const ext = (file.match(/\.(\w+)$/) || [])[1] || 'png'
    const cloudPath = `banners/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`
    this.setData({ uploading: true })
    try {
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: file })
      const callRes = await wx.cloud.callFunction({
        name: 'manageBanners',
        data: {
          action: 'create',
          data: { fileID: up.fileID, title: this.data.title || '轮播图', sort: this.data.list.length, isActive: true },
        },
      })
      const r = (callRes && callRes.result) || {}
      if (!r.success) {
        throw new Error(r.message || '服务端拒绝保存（可能无权限或未部署云函数）')
      }
      this.setData({ uploading: false, title: '' })
      this.load()
    } catch (err) {
      this.setData({ uploading: false })
      console.error('banner upload error', err)
      const msg = (err && (err.errMsg || err.message)) || '上传失败'
      wx.showModal({
        title: '上传失败',
        content: String(msg).slice(0, 300),
        showCancel: false,
      })
    }
  },

  async toggle(e) {
    const { id, active } = e.currentTarget.dataset
    try {
      await wx.cloud.callFunction({ name: 'manageBanners', data: { action: 'toggleActive', id, isActive: !active } })
      this.load()
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  async remove(e) {
    const { id, fileid } = e.currentTarget.dataset
    wx.showModal({
      title: '删除轮播图',
      content: '确定删除该轮播图？',
      success: async (r) => {
        if (!r.confirm) return
        wx.showLoading({ title: '删除' })
        try {
          if (fileid) await wx.cloud.deleteFile({ fileList: [fileid] })
          await wx.cloud.callFunction({ name: 'manageBanners', data: { action: 'delete', id } })
          wx.hideLoading()
          this.load()
        } catch (err) {
          wx.hideLoading()
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      },
    })
  },

  async move(e) {
    const { idx, dir } = e.currentTarget.dataset
    const list = this.data.list.slice()
    const target = idx + (dir === 'up' ? -1 : 1)
    if (target < 0 || target >= list.length) return
    const tmp = list[idx]
    list[idx] = list[target]
    list[target] = tmp
    const orderedIds = list.map((x) => x._id)
    wx.showLoading({ title: '排序' })
    try {
      await wx.cloud.callFunction({ name: 'manageBanners', data: { action: 'reorder', orderedIds } })
      wx.hideLoading()
      this.load()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '排序失败', icon: 'none' })
    }
  },
})
