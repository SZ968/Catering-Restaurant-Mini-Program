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

// 评价系统：create（任意用户提交）、reply（管理员回复）、delete（管理员删除）
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, data } = event || {}

  try {
    if (action === 'create') {
      const rating = Math.min(5, Math.max(1, Number((data && data.rating) || 5)))
      const content = ((data && data.content) || '').toString().slice(0, 500)
      const images = (data && data.images) || []
      const res = await db.collection('res_reviews').add({
        data: {
          openid: OPENID,
          rating,
          content,
          images,
          reply: null,
          isActive: true,
          createTime: Date.now(),
        },
      })
      return { success: true, _id: res._id }
    }

    if (action === 'reply') {
      await ensureAdmin(OPENID)
      const id = data && data.id
      const replyContent = ((data && data.content) || '').toString().slice(0, 500)
      if (!id || !replyContent) throw new Error('回复内容不能为空')
      await db.collection('res_reviews').doc(id).update({
        data: { reply: { content: replyContent, createTime: Date.now() } },
      })
      return { success: true }
    }

    if (action === 'delete') {
      await ensureAdmin(OPENID)
      const id = data && data.id
      if (!id) throw new Error('缺少 id')
      await db.collection('res_reviews').doc(id).remove()
      return { success: true }
    }

    return { success: false, message: '未知操作: ' + action }
  } catch (e) {
    return { success: false, message: e.message || '操作失败', code: e.code }
  }
}
