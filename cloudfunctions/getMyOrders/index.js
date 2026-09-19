const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 返回当前用户的所有订单（按时间倒序）
exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  try {
    const res = await db
      .collection('res_orders')
      .where({ openid: OPENID })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()
    return { success: true, orders: res.data || [] }
  } catch (e) {
    return { success: false, message: e.message || '查询失败' }
  }
}
