var app=getApp();
Page({

  data:{
   userInfo:'',
  },
  
  onLoad(){
    let user=wx.getStorageSync('user')
    console.log('进入小程序的index页面',user)
    this.setData({
      userInfo:user
    })
  },
  //授权登录
  login(){
   
console.log('点击事件执行了')
wx.getUserProfile({
  desc: '必须授权之后方可使用',//后续会展示在弹框当中
  success:res=>{
    let user=res.userInfo
    //把用户信息缓存到本地
    wx.setStorageSync('user',user)
  console.log('授权成功',res.userInfo)
  this.setData({
    userInfo:user
  })
  },
  fail:res=>{
  console.log('授权失败',res)
  }
})
  },
 //退出登录
 loginOut(){
 
   this.setData({
     userInfo:''
   })
   wx.setStorageSync('user', '')
 },
 jumpPage:function(){
   wx.navigateTo({
     url: '/pages/introduction/introduction',
   })
 }
})
