window.onload = function() {
    var slide = document.getElementsByClassName('slide')[0];
    var imgs = document.getElementsByClassName('slide')[0].getElementsByTagName('img');
    var slick_dots = document.getElementsByClassName('slick-dots')[0].getElementsByTagName('label');
    // 切换图片的速度
    var margin_left = 0;
    //定义定时器timer
    var timer;
    //屏幕的宽度,根据屏幕的宽度自适应图片的宽度，（即自适应轮播图）
    var winWidth = document.documentElement.scrollWidth || document.body.scrollWidth;
    run();
    // 绑定轮播图图片鼠标移入移出事件
    for (let i = 0; i < imgs.length; i++) {
        imgs[i].onmousemove = function() {
            clearTimeout(timer);
            margin_left = -i * 100;
            slide.style.marginLeft = margin_left + "%";
        };
        imgs[i].onmouseleave = function() {
            run();
        }
    }
    // 绑定轮播图小圆点鼠标移入移出事件
    for (let i = 0; i < slick_dots.length; i++) {
        slick_dots[i].onmousemove = function() {
            clearTimeout(timer);
            margin_left = -i * 100;
            slide.style.marginLeft = margin_left + "%";
            changeDots(i);
        };
        slick_dots[i].onmouseleave = function() {
            run();
        }
    }
    // 运行轮播图滚动
    function run() {
        var n = (-margin_left % 100 === 0) ? 5000 : 10;
        timer = setTimeout(run, n);
        if (margin_left === -400) {
            margin_left = 0;
            slide.style.marginLeft = 0;
        }
        var index = Math.floor(-margin_left / 100);
        if (index < 4) {
            changeDots(index);
        }
        slide.style.marginLeft = margin_left + "%";
        margin_left -= 1;
    }
    // 小圆点的背景色随轮播图滚动而滚动
    function changeDots(m) {
        // 改代码用于初始化所有原点长度
        for (let i = 0; i < slick_dots.length; i++) {
            slick_dots[i].style.width = "10px";
        }
        slick_dots[m].style.width = "35px";
    }
};