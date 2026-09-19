// 管理员权限校验：复用 checkAdmin 云函数
// register=true 时：若尚无任何管理员，则将当前用户注册为店主（首次初始化）
async function checkAdmin(register) {
  const res = await wx.cloud.callFunction({
    name: 'checkAdmin',
    data: register ? { register: true } : {},
  })
  return (res.result && res.result.isAdmin) || false
}

// 管理员申请 / 列表 / 审核通过 / 移除（走 manageAdmins 云函数）
async function manageAdmins(action, data) {
  const res = await wx.cloud.callFunction({
    name: 'manageAdmins',
    data: Object.assign({ action }, data || {}),
  })
  return res.result || {}
}

module.exports = { checkAdmin, manageAdmins }
