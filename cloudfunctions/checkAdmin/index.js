const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 校验当前用户是否为管理员
// event.register=true 时：若尚无任何管理员，则将当前用户注册为店主（首次初始化）
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()

  const admin = await db.collection('res_admins').where({ openid: OPENID }).get()
  if (admin.data && admin.data.length) {
    return { success: true, isAdmin: true, openid: OPENID }
  }

  if (event.register) {
    const _ = db.command
    // 清理可能由控制台 initData 误写的无效 openid 记录（空字符串或字段不存在）
    await db
      .collection('res_admins')
      .where(_.or([{ openid: '' }, { openid: _.exists(false) }]))
      .remove()

    const all = await db.collection('res_admins').count()
    if (all.total === 0) {
      await db.collection('res_admins').add({
        data: { openid: OPENID, role: 'owner', name: '店主', createTime: Date.now() },
      })
      return { success: true, isAdmin: true, openid: OPENID }
    }
    return { success: true, isAdmin: false, openid: OPENID, message: '已有管理员，请联系开发者添加' }
  }

  return { success: true, isAdmin: false, openid: OPENID }
}
