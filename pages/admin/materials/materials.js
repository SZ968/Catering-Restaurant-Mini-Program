const { getDB, COLLECTIONS } = require('../../../utils/cloud')

Page({
  data: {
    list: [],
    types: [
      { key: 'hero', label: '门店形象' },
      { key: 'env', label: '店内环境' },
      { key: 'rule', label: '规章制度' },
    ],
    typeIndex: 2,
    uploading: false,
    title: '',
  },

  onShow() {
    this.load()
  },

  async load() {
    const db = getDB()
    const res = await db.collection(COLLECTIONS.materials).orderBy('sort', 'asc').get()
    this.setData({ list: res.data || [] })
  },

  onType(e) {
    this.setData({ typeIndex: Number(e.detail.value) })
  },
  onTitle(e) {
    this.setData({ title: e.detail.value })
  },

  async upload() {
    const res = await wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'] })
    const file = res.tempFiles[0].tempFilePath
    const type = this.data.types[this.data.typeIndex].key
    const ext = (file.match(/\.(\w+)$/) || [])[1] || 'png'
    const cloudPath = `materials/${type}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`
    this.setData({ uploading: true })
    try {
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: file })
      await wx.cloud.callFunction({
        name: 'manageMaterials',
        data: { action: 'create', data: { type, title: this.data.title || type, fileID: up.fileID, isActive: true } },
      })
      this.setData({ uploading: false, title: '' })
      this.load()
    } catch (err) {
      this.setData({ uploading: false })
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },

  async toggle(e) {
    const { id, active } = e.currentTarget.dataset
    try {
      await wx.cloud.callFunction({ name: 'manageMaterials', data: { action: 'toggleActive', id, isActive: !active } })
      this.load()
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  remove(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除素材',
      content: '确定删除该素材？',
      success: async (r) => {
        if (!r.confirm) return
        wx.showLoading({ title: '删除' })
        try {
          await wx.cloud.callFunction({ name: 'manageMaterials', data: { action: 'delete', id } })
          wx.hideLoading()
          this.load()
        } catch (err) {
          wx.hideLoading()
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      },
    })
  },

  preview(e) {
    wx.previewImage({ current: e.currentTarget.dataset.url, urls: this.data.list.map((m) => m.fileID) })
  },
})
