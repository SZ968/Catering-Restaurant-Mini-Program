const { SHOP_ADDRESS, MAP_SEARCH_NAME, SHOP_LOCATION, PHONES } = require('../../utils/config')
const shopSvc = require('../../services/shop')

Page({
  data: {
    latitude: SHOP_LOCATION.latitude,
    longitude: SHOP_LOCATION.longitude,
    name: MAP_SEARCH_NAME,
    address: SHOP_ADDRESS,
    phones: PHONES,
    markers: [],
  },

  onLoad() {
    this.applyMarkers()
    shopSvc
      .getShopInfo()
      .then((info) => {
        const latitude = info.latitude || SHOP_LOCATION.latitude
        const longitude = info.longitude || SHOP_LOCATION.longitude
        this.setData({
          latitude,
          longitude,
          name: info.mapSearchName || MAP_SEARCH_NAME,
          address: info.address || SHOP_ADDRESS,
          phones: info.phones && info.phones.length ? info.phones : PHONES,
        })
        this.applyMarkers()
      })
      .catch(() => {})
  },

  applyMarkers() {
    this.setData({
      markers: [
        {
          id: 1,
          latitude: this.data.latitude,
          longitude: this.data.longitude,
          title: this.data.name,
          width: 32,
          height: 32,
        },
      ],
    })
  },

  openNav() {
    wx.openLocation({
      latitude: Number(this.data.latitude),
      longitude: Number(this.data.longitude),
      name: this.data.name,
      address: this.data.address,
    })
  },

  call(e) {
    wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.phone })
  },
})
