const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 营业配置管理（仅管理员）：更新营业状态单文档
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const admin = await db.collection('res_admins').where({ openid: OPENID }).get()
  if (!admin.data || !admin.data.length) return { success: false, message: '无权限' }

  if (event.action === 'update') {
    const { isOpen, allowDelivery, notice, dailyHours } = event.data
    try {
      await db.collection('res_business_status').doc('singleton').update({
        data: { isOpen, allowDelivery, notice, dailyHours, updateTime: Date.now() },
      })
      return { success: true }
    } catch (e) {
      return { success: false, message: e.message || '保存失败' }
    }
  }
  return { success: false, message: '未知操作' }
}
