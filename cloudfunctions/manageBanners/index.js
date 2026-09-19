const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 轮播图管理（仅管理员）：list / create / toggleActive / delete / reorder
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { success: false, message: '无法获取用户身份，请从小程序端调用，不要在云函数测试面板直接测试' }
  }

  const admin = await db.collection('res_admins').where({ openid: OPENID }).get()
  if (!admin.data || !admin.data.length) {
    return { success: false, message: '无权限：当前用户不是管理员' }
  }

  const { action, id, isActive, data, orderedIds } = event
  try {
    if (action === 'list') {
      const res = await db.collection('res_banners').orderBy('sort', 'asc').limit(100).get()
      return { success: true, list: res.data || [] }
    }
    if (action === 'create') {
      const res = await db.collection('res_banners').add({
        data: Object.assign(
          { isActive: true, sort: 999, createTime: Date.now() },
          data,
        ),
      })
      return { success: true, _id: res._id }
    }
    if (action === 'toggleActive') {
      await db.collection('res_banners').doc(id).update({ data: { isActive } })
      return { success: true }
    }
    if (action === 'delete') {
      await db.collection('res_banners').doc(id).remove()
      return { success: true }
    }
    if (action === 'reorder') {
      const tasks = (orderedIds || []).map((bid, idx) =>
        db.collection('res_banners').doc(bid).update({ data: { sort: idx } }),
      )
      await Promise.all(tasks)
      return { success: true }
    }
    return { success: false, message: '未知操作' }
  } catch (e) {
    return { success: false, message: e.message || '操作失败' }
  }
}
