const { getDB, COLLECTIONS } = require('../../../utils/cloud')

Page({
  data: {
    list: [],
    showForm: false,
    form: { name: '', sort: '1' },
  },

  onShow() {
    this.load()
  },

  async load() {
    const db = getDB()
    const res = await db.collection(COLLECTIONS.categories).orderBy('sort', 'asc').get()
    this.setData({ list: res.data || [] })
  },

  toggleForm() {
    this.setData({ showForm: !this.data.showForm })
  },

  onField(e) {
    const f = e.currentTarget.dataset.field
    this.setData({ [`form.${f}`]: e.detail.value })
  },

  async submit() {
    const f = this.data.form
    if (!f.name) return wx.showToast({ title: '请填写名称', icon: 'none' })
    wx.showLoading({ title: '保存' })
    try {
      await wx.cloud.callFunction({
        name: 'manageCategory',
        data: { action: 'create', data: { name: f.name, sort: Number(f.sort) || 1, isActive: true } },
      })
      wx.hideLoading()
      this.setData({ showForm: false, form: { name: '', sort: '1' } })
      this.load()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  async toggleActive(e) {
    const { id, active } = e.currentTarget.dataset
    try {
      await wx.cloud.callFunction({ name: 'manageCategory', data: { action: 'toggleActive', id, isActive: !active } })
      this.load()
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  remove(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除分类',
      content: '确定删除该分类？',
      success: async (r) => {
        if (!r.confirm) return
        wx.showLoading({ title: '删除' })
        try {
          await wx.cloud.callFunction({ name: 'manageCategory', data: { action: 'delete', id } })
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
