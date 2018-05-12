﻿  $(window).resize(resizeCanvas);
    $(window).load(onloadFun);
    var model = { //数据配置
        hue: 237,
        stars: [],
        starImg: null,
        count: 0,
        smoke: null,
        maxStars: 2000,
    }

    var canvas;
    var ctx ;
    var starImg;

    function init() {
        canvas = $("#canvas_app");
        ctx = canvas.get(0).getContext("2d");

        createStar(); //星星
        createSmoke(); //烟雾
        animation();

    }

    function animation() {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'hsla(' + model.hue + ', 64%, 6%, 1)';
        ctx.fillRect(0, 0, $(window).get(0).innerWidth, $(window).get(0).innerHeight)
        ctx.globalCompositeOperation = 'lighter';

        for (var i = 1, l = model.stars.length; i < l; i++) {
            model.stars[i].draw(ctx, model.starImg);
        };

        model.smoke.update(ctx);

        window.requestAnimationFrame(animation);
    }

    function createStar() {

        //圆点
        var canvas2 = document.createElement('canvas');
        model.starImg = canvas2;
        var ctx2 = canvas2.getContext("2d");
        canvas2.width = 88;
        canvas2.height = 88;
        var half = canvas2.width / 2;
        var gradient2 = ctx2.createRadialGradient(half, half, 0, half, half, half);
        gradient2.addColorStop(0.01, '#fff');
        gradient2.addColorStop(0.1, 'hsl(' + model.hue + ', 61%, 33%)');
        gradient2.addColorStop(0.15, 'hsl(' + model.hue + ', 64%, 6%)');
        gradient2.addColorStop(0.26, 'transparent');
        ctx2.fillStyle = gradient2;
        ctx2.beginPath();
        ctx2.arc(half, half, half, 0, Math.PI * 2);
        ctx2.fill();

        for (var i = 0; i < model.maxStars; i++) {
            var star = new Star($(window).get(0).innerWidth, $(window).get(0).innerHeight, model.maxStars);
            model.stars[i] = star;
        }
    }

    function createSmoke() {
        model.smoke = new Smoke();
    }

    function resizeCanvas() {
        canvas.attr("width", $(window).get(0).innerWidth);
        canvas.attr("height", $(window).get(0).innerHeight);
        ctx.fillRect(0, 0, canvas.width(), canvas.height());
        //图片
        $(".second").attr("width", $(window).get(0).innerWidth);
        $(".second").attr("height", $(window).get(0).innerHeight);
    }



    function onloadFun() {
        init();
        resizeCanvas();
    }