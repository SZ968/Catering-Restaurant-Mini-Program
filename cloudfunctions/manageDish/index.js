const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 菜品管理（仅管理员）：create / updateStatus / delete
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const admin = await db.collection('res_admins').where({ openid: OPENID }).get()
  if (!admin.data || !admin.data.length) return { success: false, message: '无权限' }

  const { action, id, status, data } = event
  try {
    if (action === 'create') {
      const now = Date.now()
      const doc = Object.assign(
        { status: 'on', sort: 999, sales: 0, createTime: now, tags: [], description: '' },
        data
      )
      const res = await db.collection('res_dishes').add({ data: doc })
      return { success: true, _id: res._id }
    }
    if (action === 'updateStatus') {
      await db.collection('res_dishes').doc(id).update({ data: { status, updateTime: Date.now() } })
      return { success: true }
    }
    if (action === 'delete') {
      await db.collection('res_dishes').doc(id).remove()
      return { success: true }
    }
    return { success: false, message: '未知操作' }
  } catch (e) {
    return { success: false, message: e.message || '操作失败' }
  }
}
