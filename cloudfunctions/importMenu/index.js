const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  } catch (e) {
    if (e && e.errCode !== -502001) {
      console.warn(`createCollection ${name} warn:`, e.message || e)
    }
  }
}

// 真实菜单（来自店主提供的纸质菜单）。运行：云开发控制台 -> importMenu -> 测试运行（无参数）
// 本函数会清空 res_categories / res_dishes 后写入真实数据，可重复运行。

const CATEGORIES = [
  { name: '锅底（虾锅）', sort: 1 },
  { name: '肉类', sort: 2 },
  { name: '组合类', sort: 3 },
  { name: '丸类', sort: 4 },
  { name: '豆制品/蔬菜', sort: 5 },
  { name: '凉菜类', sort: 6 },
  { name: '面食小料', sort: 7 },
  { name: '热菜', sort: 8 },
  { name: '主食/锅类', sort: 9 },
]

const DISHES = {
  '锅底（虾锅）': [
    { name: '小锅', price: 78 },
    { name: '中锅', price: 88 },
    { name: '大锅', price: 98 },
    { name: '特大锅', price: 118 },
    { name: '加虾', price: 49, desc: '49元/斤' },
  ],
  '肉类': [
    { name: '手切牛肉', price: 39 },
    { name: '手切羊肉', price: 39 },
    { name: '五香牛肚', price: 39 },
    { name: '莲藕鲜肉丸', price: 36 },
    { name: '手切五花肉', price: 36 },
    { name: '肥牛卷', price: 30 },
    { name: '干炸小酥肉', price: 36 },
  ],
  '组合类': [
    { name: '丸类组合', price: 32 },
    { name: '菌类组合', price: 28 },
    { name: '蔬菜组合', price: 22 },
  ],
  '丸类': [
    { name: '牛肉丸', price: 26 },
    { name: '撒尿丸', price: 26 },
    { name: '鱼豆腐', price: 22 },
    { name: '亲亲肠', price: 22 },
    { name: '包心虾丸', price: 22 },
    { name: '包心鱼丸', price: 22 },
    { name: '焦炸丸', price: 20 },
    { name: '肉燕', price: 22 },
  ],
  '豆制品/蔬菜': [
    { name: '黄豆芽', price: 6 },
    { name: '豆腐皮', price: 10 },
    { name: '鲜豆腐', price: 10 },
    { name: '冻豆腐', price: 10 },
    { name: '白萝卜', price: 10 },
    { name: '冬瓜片', price: 10 },
    { name: '土豆粉', price: 10 },
    { name: '水晶粉', price: 10 },
    { name: '鸭血', price: 10 },
    { name: '土豆片', price: 10 },
    { name: '香菇', price: 12 },
    { name: '川粉', price: 12 },
    { name: '芋头粉', price: 12 },
    { name: '鲜海带', price: 12 },
    { name: '金针菇', price: 12 },
    { name: '平菇', price: 12 },
    { name: '农家粉条', price: 12 },
    { name: '豆油皮', price: 12 },
    { name: '黑木耳', price: 12 },
    { name: '铁棍山药', price: 12 },
    { name: '笋尖', price: 12 },
    { name: '莲菜', price: 12 },
    { name: '油炸豆腐', price: 12 },
    { name: '娃娃菜', price: 10 },
    { name: '生菜', price: 8 },
    { name: '小白菜', price: 8 },
    { name: '空心菜', price: 8 },
    { name: '白菜', price: 8 },
    { name: '菠菜', price: 8 },
  ],
  '凉菜类': [
    { name: '红油耳片', price: 38 },
    { name: '秘制皮冻', price: 30 },
    { name: '卤水牛肉', price: 58 },
    { name: '花生米', price: 12 },
    { name: '姜汁变蛋', price: 15 },
    { name: '四川泡菜', price: 12 },
    { name: '凉拌菜心', price: 12 },
    { name: '油炸花生', price: 12 },
    { name: '凉拌黄瓜', price: 12 },
    { name: '红油变蛋', price: 15 },
    { name: '蒜泥茄子', price: 16 },
    { name: '农家蒸槐花', price: 18 },
    { name: '农家粉条拌菠菜', price: 18 },
    { name: '凉拌时令野菜', price: 20 },
    { name: '香菜拌木耳', price: 22 },
    { name: '泡汁娃娃菜', price: 22 },
    { name: '蒸山野菜', price: 22 },
    { name: '爽脆耳丝', price: 38 },
    { name: '蒜泥白肉', price: 38 },
    { name: '五香牛肉', price: 58 },
  ],
  '面食小料': [
    { name: '龙须面', price: 6 },
    { name: '杂豆面', price: 6 },
    { name: '农家手擀面', price: 8 },
    { name: '芝麻酱', price: 3 },
    { name: '辣椒油', price: 3 },
    { name: '蒜泥', price: 3 },
  ],
  '热菜': [
    { name: '农家炒红薯面条', price: 16 },
    { name: '蒜蓉炒菠菜', price: 18 },
    { name: '农家炒粉条', price: 22 },
    { name: '手工炒凉粉', price: 22 },
    { name: '小葱煎豆腐', price: 22 },
    { name: '槐花土鸡蛋', price: 22 },
    { name: '红烧红薯焖子', price: 28 },
    { name: '农家大锅菜', price: 32 },
    { name: '川香回锅肉', price: 38 },
    { name: '青椒牛肉', price: 48 },
    { name: '孜然羊肉', price: 48 },
    { name: '烧肥肠', price: 68 },
  ],
  '主食/锅类': [
    { name: '猴王炖土鸡', price: 138 },
    { name: '手工油烙饼', price: 10 },
  ],
}

async function clearCollection(name) {
  let guard = 0
  while (guard < 100) {
    const res = await db.collection(name).where({ _id: _.exists(true) }).remove()
    if (!res.stats || res.stats.removed === 0) break
    guard++
  }
}

exports.main = async () => {
  // 先建表（云开发集合不会自动创建）
  await Promise.all([
    ensureCollection('res_categories'),
    ensureCollection('res_dishes'),
  ])

  await clearCollection('res_categories')
  await clearCollection('res_dishes')

  // 串行写入分类（确保 catIdMap 100% 完整，避免并发丢分类导致菜品 categoryId 为空）
  const catIdMap = {}
  for (const c of CATEGORIES) {
    const r = await db.collection('res_categories').add({
      data: { name: c.name, sort: c.sort, isActive: true, createTime: Date.now() },
    })
    catIdMap[c.name] = r._id
    console.log(`写入分类 [${c.sort}] ${c.name} -> ${r._id}`)
  }

  // 组装菜品记录
  let n = 0
  const dishRecords = []
  for (const catName of Object.keys(DISHES)) {
    const categoryId = catIdMap[catName] || ''
    if (!categoryId) {
      console.warn(`分类 ${catName} 未找到对应 _id，跳过该分类下菜品`)
      continue
    }
    for (const d of DISHES[catName]) {
      dishRecords.push({
        name: d.name,
        categoryId,
        price: d.price,
        image: '',
        description: d.desc || '',
        tags: [],
        specs: [],
        status: 'on',
        sort: n,
        sales: 0,
        createTime: Date.now(),
      })
      n++
    }
  }

  // 批量并发写入菜品 + 失败自动重试：控制台测试面板默认 3 秒超时，
  // 串行 93 次 add 会超时；改为每批 5 道并发，控制总时长在 3 秒内。
  const BATCH = 5
  let added = 0
  let failed = 0
  const errors = []

  async function addOne(record, attempt = 1) {
    try {
      await db.collection('res_dishes').add({ data: record })
      return { ok: true }
    } catch (e) {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 30))
        return addOne(record, attempt + 1)
      }
      return { ok: false, error: e.message || String(e) }
    }
  }

  for (let i = 0; i < dishRecords.length; i += BATCH) {
    const batch = dishRecords.slice(i, i + BATCH)
    const results = await Promise.all(batch.map((record) => addOne(record)))
    results.forEach((res, idx) => {
      const record = batch[idx]
      if (res.ok) {
        added++
      } else {
        failed++
        errors.push({ name: record.name, msg: res.error })
        console.error(`写入菜品失败 ${record.name}:`, res.error)
      }
    })
  }

  // 诊断：统计每个分类预期写入的菜品数（基于 dishRecords）
  const categoryStats = {}
  for (const rec of dishRecords) {
    const catName = Object.keys(catIdMap).find((k) => catIdMap[k] === rec.categoryId) || '未知'
    categoryStats[catName] = (categoryStats[catName] || 0) + 1
  }

  return {
    success: failed === 0,
    categories: CATEGORIES.length,
    dishesExpected: n,
    dishesAdded: added,
    dishesFailed: failed,
    categoryStats,
    errors: errors.slice(0, 10),
  }
}
