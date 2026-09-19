const feedSvc = require('../../services/feed')
const { checkAdmin } = require('../../services/admin')

Component({
  data: {
    list: [],
    loading: true,
    isAdmin: false,
    composing: false,
    note: '',
    tempImages: [],
    submitting: false,
  },

  lifetimes: {
    attached() {
      this.load()
      this.refreshAdmin()
    },
  },

  methods: {
    async load() {
      try {
        const list = await feedSvc.getMoments()
        this.setData({ list })
      } catch (e) {
        console.error('loadMoments', e)
      } finally {
        this.setData({ loading: false })
      }
    },

    async refreshAdmin() {
      try {
        this.setData({ isAdmin: await checkAdmin(false) })
      } catch (e) {
        console.error('checkAdmin', e)
      }
    },

    async onPost() {
      if (!this.data.isAdmin) {
        const ok = await checkAdmin(true)
        if (!ok) {
          wx.showToast({ title: '需管理员权限', icon: 'none' })
          return
        }
        this.setData({ isAdmin: true })
      }
      this.setData({ composing: true, note: '', tempImages: [] })
    },

    async chooseImage() {
      try {
        const res = await wx.chooseMedia({
          count: 9,
          mediaType: ['image'],
          sourceType: ['album', 'camera'],
          sizeType: ['compressed'],
        })
        const tempFiles = res.tempFiles.map((f) => f.tempFilePath)
        wx.showLoading({ title: '上传中' })
        const ids = await feedSvc.uploadImages(tempFiles)
        this.setData({ tempImages: ids })
      } catch (e) {
        if (e && e.errMsg && e.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '上传失败', icon: 'none' })
        }
      } finally {
        wx.hideLoading()
      }
    },

    removeTemp(e) {
      const i = e.currentTarget.dataset.index
      const t = this.data.tempImages.slice()
      t.splice(i, 1)
      this.setData({ tempImages: t })
    },

    onNoteInput(e) {
      this.setData({ note: e.detail.value })
    },

    noop() {},

    cancelCompose() {
      this.setData({ composing: false })
    },

    async submit() {
      const { tempImages, note } = this.data
      if (!tempImages.length) {
        wx.showToast({ title: '请先选照片', icon: 'none' })
        return
      }
      this.setData({ submitting: true })
      wx.showLoading({ title: '发布中' })
      try {
        await feedSvc.createMoment(tempImages, note.trim())
        wx.hideLoading()
        this.setData({ composing: false, note: '', tempImages: [] })
        wx.showToast({ title: '已发布', icon: 'success' })
        this.load()
      } catch (e) {
        wx.hideLoading()
        wx.showModal({ title: '发布失败', content: e.message || '请重试', showCancel: false })
      } finally {
        this.setData({ submitting: false })
      }
    },

    async onDelete(e) {
      const id = e.currentTarget.dataset.id
      const r = await wx.showModal({ title: '删除动态', content: '确定删除这条动态？' })
      if (!r.confirm) return
      try {
        await feedSvc.deleteMoment(id)
        wx.showToast({ title: '已删除', icon: 'success' })
        this.load()
      } catch (err) {
        wx.showModal({ title: '删除失败', content: err.message || '', showCancel: false })
      }
    },

    preview(e) {
      const url = e.currentTarget.dataset.url
      const urls = e.currentTarget.dataset.urls || [url]
      wx.previewImage({ current: url, urls })
    },
  },
})
