const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const action = event.action

  // 当前用户是否为管理员
  async function isAdmin() {
    const r = await db.collection('res_admins').where({ openid: OPENID }).get()
    return !!(r.data && r.data.length)
  }

  // 申请成为管理员：首次空库自动成为店主；否则写入待审核集合
  if (action === 'apply') {
    if (await isAdmin()) return { success: true, isAdmin: true }

    const name = (event.name || '新管理员').toString().slice(0, 20)
    const exist = await db.collection('res_admin_applications').where({ openid: OPENID, status: 'pending' }).get()
    if (exist.data && exist.data.length) {
      return { success: true, applied: true, message: '已提交申请，等待店主审核' }
    }

    // 全库尚无任何管理员 => 当前用户认领为店主（首次初始化）
    const all = await db.collection('res_admins').count()
    if (all.total === 0) {
      await db.collection('res_admins').add({
        data: { openid: OPENID, role: 'owner', name: '店主', createTime: Date.now() },
      })
      return { success: true, isAdmin: true, owner: true }
    }

    // 已有管理员 => 写入待审核，由店主在后台通过
    await db.collection('res_admin_applications').add({
      data: { openid: OPENID, name, status: 'pending', createTime: Date.now() },
    })
    return { success: true, applied: true, message: '已提交申请，等待店主审核' }
  }

  // 以下操作均需管理员身份
  if (!(await isAdmin())) {
    return { success: false, isAdmin: false, message: '无权限：仅管理员可操作' }
  }

  if (action === 'list') {
    const admins = (await db.collection('res_admins').orderBy('createTime', 'asc').limit(100).get()).data
    const applications = (await db.collection('res_admin_applications').where({ status: 'pending' }).orderBy('createTime', 'asc').limit(100).get()).data
    return { success: true, isAdmin: true, admins, applications }
  }

  if (action === 'approve') {
    const openid = (event.openid || '').toString()
    if (!openid) return { success: false, message: '缺少 openid' }
    const exist = await db.collection('res_admins').where({ openid }).get()
    if (exist.data && exist.data.length === 0) {
      await db.collection('res_admins').add({
        data: {
          openid,
          role: 'admin',
          name: (event.name || '管理员').toString().slice(0, 20),
          createTime: Date.now(),
        },
      })
    }
    await db.collection('res_admin_applications').where({ openid }).update({ data: { status: 'approved' } })
    return { success: true }
  }

  if (action === 'remove') {
    const openid = (event.openid || '').toString()
    if (!openid) return { success: false, message: '缺少 openid' }
    if (openid === OPENID) return { success: false, message: '不能移除自己' }
    const docs = (await db.collection('res_admins').where({ openid }).get()).data
    if (docs.length && docs[0].role === 'owner') return { success: false, message: '不能移除店主' }
    await db.collection('res_admins').where({ openid }).remove()
    return { success: true }
  }

  return { success: false, message: '未知操作' }
}
