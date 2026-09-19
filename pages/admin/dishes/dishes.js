const { getDB, COLLECTIONS } = require('../../../utils/cloud')

Page({
  data: {
    list: [],
    categories: [],
    showForm: false,
    uploading: false,
    form: { name: '', price: '', categoryIndex: 0, image: '', specText: '' },
  },

  onShow() {
    this.load()
  },

  async load() {
    const db = getDB()
    const [dishes, cats] = await Promise.all([
      db.collection(COLLECTIONS.dishes).orderBy('sort', 'asc').limit(1000).get(),
      db.collection(COLLECTIONS.categories).orderBy('sort', 'asc').limit(100).get(),
    ])
    this.setData({
      list: dishes.data || [],
      categories: cats.data || [],
    })
  },

  statusClass(status) {
    return status === 'on' ? 'on' : status === 'soldout' ? 'soldout' : 'off'
  },

  async setStatus(e) {
    const { id, status } = e.currentTarget.dataset
    wx.showLoading({ title: '更新中' })
    try {
      await wx.cloud.callFunction({ name: 'manageDish', data: { action: 'updateStatus', id, status } })
      wx.hideLoading()
      this.load()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '更新失败', icon: 'none' })
    }
  },

  toggleForm() {
    this.setData({ showForm: !this.data.showForm })
  },

  onField(e) {
    const f = e.currentTarget.dataset.field
    this.setData({ [`form.${f}`]: e.detail.value })
  },

  onCate(e) {
    this.setData({ 'form.categoryIndex': Number(e.detail.value) })
  },

  async chooseImage() {
    const res = await wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'] })
    const file = res.tempFiles[0].tempFilePath
    this.setData({ uploading: true })
    const ext = (file.match(/\.(\w+)$/) || [])[1] || 'png'
    const cloudPath = `dishes/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`
    try {
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: file })
      this.setData({ 'form.image': up.fileID, uploading: false })
      wx.showToast({ title: '已上传', icon: 'success' })
    } catch (err) {
      this.setData({ uploading: false })
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },

  async submit() {
    const f = this.data.form
    const cat = this.data.categories[f.categoryIndex]
    if (!f.name || !f.price || !cat) {
      return wx.showToast({ title: '请填写名称/价格/分类', icon: 'none' })
    }
    const price = Number(f.price)
    if (isNaN(price)) return wx.showToast({ title: '价格有误', icon: 'none' })
    const specs = f.specText
      ? [{ label: '规格', options: f.specText.split('/').map((s) => s.trim()).filter(Boolean) }]
      : []
    wx.showLoading({ title: '保存中' })
    try {
      await wx.cloud.callFunction({
        name: 'manageDish',
        data: {
          action: 'create',
          data: {
            name: f.name,
            price,
            categoryId: cat._id,
            image: f.image,
            specs,
            status: 'on',
            description: '',
            tags: [],
          },
        },
      })
      wx.hideLoading()
      this.setData({
        showForm: false,
        form: { name: '', price: '', categoryIndex: 0, image: '', specText: '' },
      })
      this.load()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  remove(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除菜品',
      content: '确定删除该菜品？',
      success: async (r) => {
        if (!r.confirm) return
        wx.showLoading({ title: '删除中' })
        try {
          await wx.cloud.callFunction({ name: 'manageDish', data: { action: 'delete', id } })
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
