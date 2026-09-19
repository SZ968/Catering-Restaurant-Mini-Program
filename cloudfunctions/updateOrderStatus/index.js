const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 管理员更新订单状态（接单 / 备餐 / 完成 / 取消）
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const admin = await db.collection('res_admins').where({ openid: OPENID }).get()
  if (!admin.data || !admin.data.length) return { success: false, message: '无权限' }

  const { orderId, status } = event
  const valid = ['unpaid', 'paid', 'preparing', 'done', 'canceled']
  if (!valid.includes(status)) return { success: false, message: '状态非法' }

  try {
    await db.collection('res_orders').doc(orderId).update({
      data: { status, updateTime: Date.now() },
    })
    return { success: true }
  } catch (e) {
    return { success: false, message: e.message || '更新失败' }
  }
}
