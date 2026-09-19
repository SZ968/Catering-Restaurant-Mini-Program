const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 校验当前用户是否为管理员（复用 res_admins）
async function ensureAdmin(OPENID) {
  const a = await db.collection('res_admins').where({ openid: OPENID }).get()
  if (!a.data || !a.data.length) {
    const err = new Error('无权限：当前用户不是管理员')
    err.code = 'NO_AUTH'
    throw err
  }
  return a.data[0]
}

// 商户图文流：create（管理员发布）、delete（管理员删除）
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, data } = event || {}

  try {
    if (action === 'create') {
      await ensureAdmin(OPENID)
      const images = (data && data.images) || []
      const note = ((data && data.note) || '').toString().slice(0, 200)
      if (!images.length) throw new Error('请至少上传一张照片')
      const res = await db.collection('res_moments').add({
        data: {
          images,
          note,
          isActive: true,
          createTime: Date.now(),
          _openid: OPENID,
        },
      })
      return { success: true, _id: res._id }
    }

    if (action === 'delete') {
      await ensureAdmin(OPENID)
      const id = data && data.id
      if (!id) throw new Error('缺少 id')
      await db.collection('res_moments').doc(id).remove()
      return { success: true }
    }

    return { success: false, message: '未知操作: ' + action }
  } catch (e) {
    return { success: false, message: e.message || '操作失败', code: e.code }
  }
}
