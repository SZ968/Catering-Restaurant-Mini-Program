const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  } catch (e) {
    // 集合已存在或权限不足时忽略；其他错误保留日志
    if (e && e.errCode !== -502001) {
      console.warn(`createCollection ${name} warn:`, e.message || e)
    }
  }
}

// 初始化示例数据（仅在对应集合为空时写入，幂等安全）
// 运行方式：CloudBase 控制台 -> 云函数 initData -> 测试运行
exports.main = async () => {
  // 先建表：云开发集合不会自动创建，必须先显式创建
  await Promise.all([
    ensureCollection('res_shop_info'),
    ensureCollection('res_business_status'),
    ensureCollection('res_categories'),
    ensureCollection('res_dishes'),
    ensureCollection('res_admins'),
    ensureCollection('res_orders'),
    ensureCollection('res_banners'),
    ensureCollection('res_announcements'),
    ensureCollection('res_page_modules'),
    ensureCollection('res_moments'),
    ensureCollection('res_reviews'),
    ensureCollection('res_admin_applications'),
  ])

  const result = {}

  // 1) 店铺信息（每次都覆盖写入，便于改地址后重跑生效）
  const shopCount = await db.collection('res_shop_info').count()
  await db.collection('res_shop_info').doc('singleton').set({
    data: {
      name: '猴王大虾',
      slogan: '好吃的大虾会说话',
      phones: ['15136309816', '13526951858'],
        address: '洛阳市宜阳县锦屏镇二里庙',
        mapSearchName: '猴王大虾(锦屏镇二里庙)',
        latitude: 34.503826,
        longitude: 112.158683,
      heroImages: [],
      logo: '',
      createTime: Date.now(),
    },
  })
  result.shopInfo = shopCount.total === 0 ? 'seeded' : 'updated'

  // 2) 营业状态
  const bizCount = await db.collection('res_business_status').count()
  if (bizCount.total === 0) {
    const dailyHours = [0, 1, 2, 3, 4, 5, 6].map((wd) => ({
      weekday: wd,
      openTime: '10:00',
      closeTime: '22:00',
      isClosed: false,
    }))
    await db.collection('res_business_status').doc('singleton').set({
      data: {
        isOpen: true,
        allowDelivery: false,
        notice: '',
        dailyHours,
        updateTime: Date.now(),
      },
    })
    result.businessStatus = 'seeded'
  }

  // 2.4) 首页模块配置（仅空库时写入默认 6 个模块；visible 控制显隐，sort 控制顺序）
  const modCount = await db.collection('res_page_modules').count()
  if (modCount.total === 0) {
    const defaultModules = [
      { type: 'hero', title: '品牌轮播', visible: true, sort: 1 },
      { type: 'business', title: '营业状态', visible: true, sort: 2 },
      { type: 'services', title: '核心服务', visible: true, sort: 3 },
      { type: 'address', title: '门店地址', visible: true, sort: 4 },
      { type: 'announcements', title: '门店公告', visible: true, sort: 5 },
      { type: 'merchant', title: '商家管理入口', visible: true, sort: 6 },
    ]
    for (const m of defaultModules) {
      await db.collection('res_page_modules').add({ data: m })
    }
    result.pageModules = 'seeded'
  }

  // 2.5) 默认公告（仅空库时写一条欢迎公告，避免首页公告区空白）
  const annCount = await db.collection('res_announcements').count()
  if (annCount.total === 0) {
    await db.collection('res_announcements').add({
      data: {
        title: '欢迎光临猴王大虾',
        content: '感谢您关注本店！每日新鲜食材，欢迎到店品尝。营业时间 10:00 - 22:00。',
        isActive: true,
        pin: true,
        sort: 999,
        createTime: Date.now(),
      },
    })
    result.announcement = 'seeded'
  }

  // 3) 分类
  const catCount = await db.collection('res_categories').count()
  let catIds = {}
  if (catCount.total === 0) {
    const cats = [
      { name: '锅类套餐', sort: 1 },
      { name: '肉类', sort: 2 },
      { name: '豆制品/蔬菜', sort: 3 },
      { name: '凉菜类', sort: 4 },
      { name: '热菜', sort: 5 },
      { name: '特色菜', sort: 6 },
      { name: '主食/面食', sort: 7 },
    ]
    for (const c of cats) {
      const res = await db.collection('res_categories').add({
        data: Object.assign({ isActive: true, createTime: Date.now() }, c),
      })
      catIds[c.name] = res._id
    }
    result.categories = 'seeded'
  } else {
    const all = await db.collection('res_categories').get()
    all.data.forEach((c) => (catIds[c.name] = c._id))
  }

  // 4) 示例菜品（仅在无菜品时写入）
  const dishCount = await db.collection('res_dishes').count()
  if (dishCount.total === 0) {
    const samples = [
      { name: '招牌麻辣大虾锅（中锅）', categoryName: '锅类套餐', price: 88, tags: ['招牌'], description: '鲜活大虾配秘制麻辣底料，香辣过瘾。' },
      { name: '香辣虾尾', categoryName: '特色菜', price: 68, tags: ['微辣'], description: '去头虾尾，肉质紧实，香辣入味。' },
      { name: '秘制卤味拼盘', categoryName: '凉菜类', price: 32, tags: [], description: '多种卤味拼盘，下酒一绝。' },
      { name: '蒜蓉时蔬', categoryName: '豆制品/蔬菜', price: 22, tags: ['清淡'], description: '当季时蔬蒜蓉清炒。' },
      { name: '手工油烙饼', categoryName: '主食/面食', price: 12, tags: ['招牌'], description: '外酥里嫩，蘸汤一绝。' },
    ]
    for (const s of samples) {
      const categoryId = catIds[s.categoryName] || ''
      await db.collection('res_dishes').add({
        data: {
          name: s.name,
          categoryId,
          price: s.price,
          image: '',
          description: s.description,
          tags: s.tags,
          specs: [{ label: '辣度', options: ['微辣', '中辣', '特辣'] }],
          status: 'on',
          sort: 999,
          sales: 0,
          createTime: Date.now(),
        },
      })
    }
    result.dishes = 'seeded'
  }

  // 注意：管理员（店主）不再由 initData 注册。
  // 控制台触发云函数没有真实微信 OPENID，会写入废记录导致登录失败。
  // 改为：在小程序管理端登录页点「申请成为管理员」时，由 checkAdmin 用真实 OPENID 认领。

  return { success: true, result }
}
