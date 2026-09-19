const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 公告管理（仅管理员）：list / create / update / delete / toggleActive
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { success: false, message: '无法获取用户身份，请从小程序端调用，不要在云函数测试面板直接测试' }
  }

  const admin = await db.collection('res_admins').where({ openid: OPENID }).get()
  if (!admin.data || !admin.data.length) {
    return { success: false, message: '无权限：当前用户不是管理员' }
  }

  const { action, id, isActive, data } = event
  try {
    if (action === 'list') {
      const res = await db
        .collection('res_announcements')
        .orderBy('pin', 'desc')
        .orderBy('createTime', 'desc')
        .limit(100)
        .get()
      return { success: true, list: res.data || [] }
    }
    if (action === 'create') {
      const res = await db.collection('res_announcements').add({
        data: Object.assign(
          { isActive: true, pin: false, sort: 999, createTime: Date.now() },
          data,
        ),
      })
      return { success: true, _id: res._id }
    }
    if (action === 'update') {
      await db.collection('res_announcements').doc(id).update({ data })
      return { success: true }
    }
    if (action === 'toggleActive') {
      await db.collection('res_announcements').doc(id).update({ data: { isActive } })
      return { success: true }
    }
    if (action === 'delete') {
      await db.collection('res_announcements').doc(id).remove()
      return { success: true }
    }
    return { success: false, message: '未知操作' }
  } catch (e) {
    return { success: false, message: e.message || '操作失败' }
  }
}
