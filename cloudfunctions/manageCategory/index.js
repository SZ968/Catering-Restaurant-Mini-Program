const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 分类管理（仅管理员）：create / toggleActive / delete
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const admin = await db.collection('res_admins').where({ openid: OPENID }).get()
  if (!admin.data || !admin.data.length) return { success: false, message: '无权限' }

  const { action, id, isActive, data } = event
  try {
    if (action === 'create') {
      const res = await db.collection('res_categories').add({
        data: Object.assign({ isActive: true, sort: 999, createTime: Date.now() }, data),
      })
      return { success: true, _id: res._id }
    }
    if (action === 'toggleActive') {
      await db.collection('res_categories').doc(id).update({ data: { isActive } })
      return { success: true }
    }
    if (action === 'delete') {
      await db.collection('res_categories').doc(id).remove()
      return { success: true }
    }
    return { success: false, message: '未知操作' }
  } catch (e) {
    return { success: false, message: e.message || '操作失败' }
  }
}
