const reviewSvc = require('../../services/reviews')
const { checkAdmin } = require('../../services/admin')

// 时间戳格式化为 YYYY-MM-DD
function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

Component({
  data: {
    list: [],
    loading: true,
    isAdmin: false,
    average: '0.0',
    total: 0,
    // 写评价弹层
    composing: false,
    rating: 5,
    content: '',
    tempImages: [],
    submitting: false,
    // 商家回复弹层
    replyingId: '',
    replyContent: '',
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
        const raw = await reviewSvc.getReviews()
        const list = raw.map((r) => Object.assign({}, r, { timeText: formatDate(r.createTime) }))
        const total = list.length
        const avg = total ? list.reduce((s, r) => s + (r.rating || 5), 0) / total : 0
        this.setData({ list, total, average: avg.toFixed(1), avgInt: Math.round(avg) })
      } catch (e) {
        console.error('loadReviews', e)
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

    // 写评价（任意用户）
    onWrite() {
      this.setData({ composing: true, rating: 5, content: '', tempImages: [] })
    },
    setRating(e) {
      this.setData({ rating: Number(e.currentTarget.dataset.star) })
    },
    onContent(e) {
      this.setData({ content: e.detail.value })
    },

    async chooseImage() {
      try {
        const res = await wx.chooseMedia({
          count: 6,
          mediaType: ['image'],
          sourceType: ['album', 'camera'],
          sizeType: ['compressed'],
        })
        const tempFiles = res.tempFiles.map((f) => f.tempFilePath)
        wx.showLoading({ title: '上传中' })
        const ids = await reviewSvc.uploadImages(tempFiles)
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
    noop() {},
    cancelCompose() {
      this.setData({ composing: false })
    },

    async submit() {
      const { content, tempImages, rating } = this.data
      if (!content.trim() && !tempImages.length) {
        wx.showToast({ title: '写点评价吧', icon: 'none' })
        return
      }
      this.setData({ submitting: true })
      wx.showLoading({ title: '提交中' })
      try {
        await reviewSvc.createReview(rating, content.trim(), tempImages)
        wx.hideLoading()
        this.setData({ composing: false })
        wx.showToast({ title: '已提交', icon: 'success' })
        this.load()
      } catch (e) {
        wx.hideLoading()
        wx.showModal({ title: '提交失败', content: e.message || '请重试', showCancel: false })
      } finally {
        this.setData({ submitting: false })
      }
    },

    // 商家回复（管理员）
    async onReply(e) {
      if (!this.data.isAdmin) {
        const ok = await checkAdmin(true)
        if (!ok) {
          wx.showToast({ title: '需管理员权限', icon: 'none' })
          return
        }
        this.setData({ isAdmin: true })
      }
      this.setData({ replyingId: e.currentTarget.dataset.id, replyContent: '' })
    },
    onReplyInput(e) {
      this.setData({ replyContent: e.detail.value })
    },
    cancelReply() {
      this.setData({ replyingId: '' })
    },
    async submitReply() {
      const { replyingId, replyContent } = this.data
      if (!replyContent.trim()) {
        wx.showToast({ title: '回复不能为空', icon: 'none' })
        return
      }
      wx.showLoading({ title: '回复中' })
      try {
        await reviewSvc.replyReview(replyingId, replyContent.trim())
        wx.hideLoading()
        this.setData({ replyingId: '' })
        wx.showToast({ title: '已回复', icon: 'success' })
        this.load()
      } catch (e) {
        wx.hideLoading()
        wx.showModal({ title: '回复失败', content: e.message || '', showCancel: false })
      }
    },

    // 删除评价（管理员）
    async onDelete(e) {
      const id = e.currentTarget.dataset.id
      const r = await wx.showModal({ title: '删除评价', content: '确定删除这条评价？' })
      if (!r.confirm) return
      try {
        await reviewSvc.deleteReview(id)
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
