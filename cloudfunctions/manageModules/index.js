const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = cloud.database().command

// 首页模块管理（仅管理员）：list / reorder / toggle / update
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const admin = await db.collection('res_admins').where({ openid: OPENID }).get()
  if (!admin.data || !admin.data.length) return { success: false, message: '无权限' }

  const { action, id, visible, title, orderedIds } = event
  try {
    if (action === 'list') {
      // 返回全部模块（含隐藏），按 sort 升序，供管理端编辑
      const res = await db
        .collection('res_page_modules')
        .orderBy('sort', 'asc')
        .limit(100)
        .get()
      return { success: true, list: res.data || [] }
    }
    if (action === 'reorder') {
      // orderedIds: 期望的模块 _id 顺序数组，依次写入 sort
      const tasks = (orderedIds || []).map((mid, idx) =>
        db.collection('res_page_modules').doc(mid).update({ data: { sort: idx + 1 } }),
      )
      await Promise.all(tasks)
      return { success: true }
    }
    if (action === 'toggle') {
      await db.collection('res_page_modules').doc(id).update({ data: { visible } })
      return { success: true }
    }
    if (action === 'update') {
      const data = {}
      if (title !== undefined) data.title = title
      await db.collection('res_page_modules').doc(id).update({ data })
      return { success: true }
    }
    return { success: false, message: '未知操作' }
  } catch (e) {
    return { success: false, message: e.message || '操作失败' }
  }
}
