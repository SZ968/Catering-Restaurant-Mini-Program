const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 管理员查看全部订单（仅管理员）
exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const admin = await db.collection('res_admins').where({ openid: OPENID }).get()
  if (!admin.data || !admin.data.length) {
    return { success: false, message: '无权限', orders: [] }
  }
  const res = await db.collection('res_orders').orderBy('createTime', 'desc').limit(100).get()
  return { success: true, orders: res.data || [] }
}
