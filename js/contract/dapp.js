"use strict";

var netPath = "https://testnet.nebulas.io";
//var netPath = "https://api.nasscan.io";

var contractAddress = "n1oeQz5HQqJ84b633EUkCfiUFXtHjJopRuf";

//var contractAddress = "n21pjMjCFZL4ePUSEGY3rndG6ScBv9ZeXZY";

var serialNumber = "";
var nebulas = require("nebulas"),
    Account = nebulas.Account,
    neb = new nebulas.Neb();
neb.setRequest(new nebulas.HttpRequest(netPath));

var NebPay = require("nebpay");     //https://github.com/nebulasio/nebPay
var nebPay = new NebPay();

var currentGalaxy;
var currentGalaxyKey;
var currentClickStarId;
var intervalQuery;
var currentGalaxyStory = new Array();
var isFirst = true;
var refreshStarInterval;

function getGalaxy(key) {
    var from = Account.NewAccount().getAddressString();

    var value = "0";
    var nonce = "0"
    var gas_price = "1000000"
    var gas_limit = "2000000"
    var callFunction = "getGalaxy";
    var callArgs = "[\""+ key +"\"]"; //in the form of ["args"]
    var contract = {
        "function": callFunction,
        "args": callArgs
    }

    neb.api.call(from, contractAddress, value, nonce, gas_price, gas_limit, contract).then(function (resp) {
        var galaxy = JSON.parse(resp.result);
        currentGalaxy = galaxy;
        createBigEventStar(galaxy.starItems);
        getStoryByGalaxy();
    }).catch(function (err) {
        console.log("error:" + err.message)
    })
}

var modelBigStar = {
    starImg: "img/star.png",
    diameter: 20
}
function createBigEventStar(positionArray) {
    for (var i = 0; i < positionArray.length; i++) {
        var img = new Image();
        img.src = modelBigStar.starImg;
        img.onclick = starClickEvent;
        img.width = modelBigStar.diameter;
        img.height = modelBigStar.diameter;
        var _top = Math.floor(positionArray[i].y / 100 * ($(window).get(0).innerHeight - modelBigStar.diameter * 2 -5));
        var _left = Math.floor(positionArray[i].x / 100 * ($(window).get(0).innerWidth - modelBigStar.diameter * 2 -5));
        $(img).offset({ top: _top, left: _left });
        $(img).attr("data-starid", positionArray[i].starId);
        var position = { x: 0, y: 0 };
        position.x = (positionArray[i].x).toFixed(2);
        position.y = positionArray[i].y.toFixed(2);
        $(img).attr("data-position", JSON.stringify(position));
        $(img).attr("data-toggle", "modal");
        $(img).attr("data-target", "#myModal");
        $(".starChain").append(img);
    }
}

function getStoryByGalaxy(callback)
{
    var from = Account.NewAccount().getAddressString();

    var value = "0";
    var nonce = "0"
    var gas_price = "1000000"
    var gas_limit = "2000000"
    var callFunction = "getStoryByGalaxy";
    var callArgs = "[\"" + currentGalaxyKey + "\"]"; //in the form of ["args"]
    var contract = {
        "function": callFunction,
        "args": callArgs
    }

    neb.api.call(from, contractAddress, value, nonce, gas_price, gas_limit, contract).then(function (resp) {
        var story = JSON.parse(resp.result);
        currentGalaxyStory = story.storyItems;
        var isDo = true;
        if (callback) {
            isDo = callback();
        }
        if (isDo) {
            for (var i = 0; i < story.storyItems.length; i++) {
                var target = $(".starChain img[data-starid='" + story.storyItems[i].starId + "']");
                target.addClass("tooltip-show");
                //target.attr("data-toggle", "tooltip");
                target.attr("title", story.storyItems[i].name);
                target.attr("data-placement", "top");
                target.on('hide.bs.tooltip', function () {
                    return false;
                });
                //$('#myModal').on('show.bs.modal', starClickEvent);
                target.tooltip('show');
            }
        }
    }).catch(function (err) {
        console.log("error:" + err.message);
    });
}


function setStar(starId,name,story,author)
{
    var to = contractAddress;
    var value = "0";
    var callFunction = "add"
    var callArgs = "[\"" + starId + "\",\"" + name + "\",\"" + story + "\",\"" + author + "\" ]"

    serialNumber = nebPay.call(to, value, callFunction, callArgs, {    //使用nebpay的call接口去调用合约,
        listener: cbPush        //设置listener, 处理交易返回信息
    });

    intervalQuery = setInterval(function () {
        funcIntervalQuery(name);
    }, 10000);
}

function cbPush(resp) {
    $("#myModalMsg .modal-body").html("你的txhash：" + resp.txhash + "<br>交易结果待区块链处理完成后显示");
    $("#myModalMsg").modal("show");
}


function funcIntervalQuery(name) {

    nebPay.queryPayInfo(serialNumber)   //search transaction result from server (result upload to server by app)
        .then(function (resp) {
            var respObject = JSON.parse(resp)
            if (respObject.code === 0) {
                $("#myModalMsg .modal-body").html("购买成功，需要几秒钟，待区块链更新数据后，页面自动显示该星球");
                $("#myModalMsg").modal("show");
                $("#inputStarName").val("");
                $("#txtContent").val("");
                $("#inputAuthor").val("");
                refreshStarInterval = setInterval(function () { isExistStarName(name); }, 5000);
                clearInterval(intervalQuery);
                intervalQuery = undefined;
            }
            else {
                // error todo
                $("#myModalMsg .modal-body").html("购买失败"+resp);
                $("#myModalMsg").modal("show");
                clearInterval(intervalQuery);
                intervalQuery = undefined;
            }
        })
        .catch(function (err) {
            console.log(err);
            $("#myModalMsg .modal-body").html("购买失败");
            $("#myModalMsg").modal("show");
            clearInterval(intervalQuery);
            intervalQuery = undefined;
        });
}
function isExistStarName(name) {
    getStoryByGalaxy(function () {
        var result = false;
        try {
            $(currentGalaxyStory).each(function () {
                if (this.name == name) {
                    clearInterval(refreshStarInterval);
                    refreshStarInterval = undefined;
                    result = true;
                }
            });
            return result;
        }
        catch (e){
            return result;
        }
    });
}


//1920 974
function starClickEvent() {
    var starId = $(this).data("starid");
    currentClickStarId = starId;
    var isExist = false;
    for (var i = 0; i < currentGalaxyStory.length; i++) {
        if (currentGalaxyStory[i].starId == starId) {
            isExist = true;
            $("#myModalLabel").text(currentGalaxyStory[i].name);
            $("#divStoryContent").text(currentGalaxyStory[i].story);
            $("#spanBuy").text(currentGalaxyStory[i].author);
        }
    }
    if (isExist) {
        $("#btnBuy").hide();
        $("#divForm").hide();
        $("#divStoryContent").show();
        $("#divBuyer").show();
    }
    else {
        $("#divBuyer").hide();
        $("#divForm").show();
        $("#divStoryContent").hide();
        $("#myModalLabel").text("");
        $("#divStoryContent").text("");
        $("#spanBuy").text("");
        $("#btnBuy").show();
    }
    $("#divErrorMsg").text("");
    var position = $(this).data("position");
    $("#spanPosition").text(currentGalaxy.name + " 坐标：" + position.x + "," + position.y);
}

function showGalaxy(key) {
    $(".starChain").empty();
    getGalaxy(key);
}

$(function () {
    $(".dropdown-menu li").each(function (i, element) {
        $(element).click(function () {
            var index = i;
            currentGalaxyKey = (index + 1).toString();
            if (intervalQuery)
            {
                clearInterval(intervalQuery);
                intervalQuery = undefined;
            }
            (refreshStarInterval)
            {
                clearInterval(refreshStarInterval);
                refreshStarInterval = undefined;
            }
            showGalaxy((++index).toString());
            $("#ddmButton").text($(element).text());
        });
    });
    $(".dropdown-menu li").first().trigger("click");
    $("[data-toggle='tooltip']").tooltip('show'); 

    if (getCookie("isFirst") != "1") {
        setCookie("isFirst", "1");
        var desc = "此项目基于星云区块链。<br>您可以查看已占用的星球信息、购买/命名未占用的星球，以及赋予这个星球一个故事。<br>当然你喜欢一个姑娘，也可以买下一颗星星，并送给她~";
        if (typeof (webExtensionWallet) === "undefined") {
            desc += "<br>购买星球需安装官方钱包插件：<a target='_blank' href='https://github.com/ChengOrangeJu/WebExtensionWallet'>WebExtensionWallet</a>安装后刷新页面";
        }
        $("#myModalMsg .modal-body").html(desc);
        $("#myModalMsg").modal("show");
    }

});

function buyStar() {
    if (typeof (webExtensionWallet) === "undefined") {
        $("#myModalMsg .modal-body").html("请安装钱包插件<a target='_blank' href='https://github.com/ChengOrangeJu/WebExtensionWallet'>WebExtensionWallet</a><br>安装后刷新页面");
        $("#myModalMsg").modal("show");
        return;
    }

    if ($("#inputStarName").val() === "") {
        $("#divErrorMsg").text("请填写星球名称");
        return;
    }
    if ($("#txtContent").val() === "") {
        $("#divErrorMsg").text("请填写星球故事");
        return;
    }
    if ($("#inputAuthor").val() === "") {
        $("#divErrorMsg").text("请填写您的昵称");
        return;
    }

    setStar(currentClickStarId, $("#inputStarName").val(), $("#txtContent").val(), $("#inputAuthor").val());

    $("#myModal").modal("hide");
}

function setCookie(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(name) == 0) { return c.substring(name.length, c.length); }
    }
    return "";
}