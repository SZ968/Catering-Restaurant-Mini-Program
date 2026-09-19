const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 返回店铺基础信息（名称、标语、电话、地址、经纬度、头图）
exports.main = async () => {
  try {
    const res = await db.collection('res_shop_info').doc('singleton').get()
    return { success: true, shopInfo: res.data || {} }
  } catch (e) {
    return { success: false, message: e.message || '查询失败' }
  }
}
