// 评价服务：读取评价、提交评价、商家回复、删除评价
const content = require('./content')

async function getReviews() {
  return content.callPublic('reviews')
}

function callManage(action, data) {
  return wx.cloud.callFunction({ name: 'manageReviews', data: { action, data } })
}

async function createReview(rating, content, images) {
  const res = await callManage('create', { rating, content, images })
  if (!res.result || !res.result.success) {
    throw new Error((res.result && res.result.message) || '提交失败')
  }
  return res.result
}

async function replyReview(id, content) {
  const res = await callManage('reply', { id, content })
  if (!res.result || !res.result.success) {
    throw new Error((res.result && res.result.message) || '回复失败')
  }
  return res.result
}

async function deleteReview(id) {
  const res = await callManage('delete', { id })
  if (!res.result || !res.result.success) {
    throw new Error((res.result && res.result.message) || '删除失败')
  }
  return res.result
}

async function uploadImages(tempFiles) {
  const ids = []
  for (const f of tempFiles) {
    const ext = (f.match(/\.(\w+)$/) || [])[1] || 'jpg'
    const cloudPath = `reviews/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`
    const up = await wx.cloud.uploadFile({ cloudPath, filePath: f })
    ids.push(up.fileID)
  }
  return ids
}

module.exports = { getReviews, createReview, replyReview, deleteReview, uploadImages }
