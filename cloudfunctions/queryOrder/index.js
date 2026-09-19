const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 查询单个订单（仅本人可见，防止串单）
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { orderId } = event
  try {
    const res = await db.collection('res_orders').doc(orderId).get()
    const order = res.data
    if (!order) return { success: false, message: '订单不存在' }
    if (order.openid !== OPENID) return { success: false, message: '无权限' }
    return { success: true, order }
  } catch (e) {
    return { success: false, message: e.message || '查询失败' }
  }
}
