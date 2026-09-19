// 商户图文流服务：读取动态、发布（上传图片+备注）、删除
const content = require('./content')

async function getMoments() {
  return content.callPublic('feed')
}

function callManage(action, data) {
  return wx.cloud.callFunction({ name: 'manageMoments', data: { action, data } })
}

async function createMoment(images, note) {
  const res = await callManage('create', { images, note })
  if (!res.result || !res.result.success) {
    throw new Error((res.result && res.result.message) || '发布失败')
  }
  return res.result
}

async function deleteMoment(id) {
  const res = await callManage('delete', { id })
  if (!res.result || !res.result.success) {
    throw new Error((res.result && res.result.message) || '删除失败')
  }
  return res.result
}

// 上传本地临时文件到云存储，返回 fileID 数组
async function uploadImages(tempFiles) {
  const ids = []
  for (const f of tempFiles) {
    const ext = (f.match(/\.(\w+)$/) || [])[1] || 'jpg'
    const cloudPath = `moments/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`
    const up = await wx.cloud.uploadFile({ cloudPath, filePath: f })
    ids.push(up.fileID)
  }
  return ids
}

module.exports = { getMoments, createMoment, deleteMoment, uploadImages }
