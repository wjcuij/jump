import AbstractPage from '../interface/AbstractPage'
import * as Stage from '../util/Stage'
import { getTexture, getBitmap } from '../util/RES'
import ScrollBg from '../gameObj/ScrollBg'
import Drawboard from '../gameObj/Drawboard'
import PlayPageUtil from './PlayPageUtil'
import { getFullSizeContainer } from '../util/common'
import HumanManager from '../gameObj/HumanManager'
import { horizontalDirection, verticalDirection } from '../util/common'
import Speed from '../util/Speed'
import { HumanManagerConstrArgs } from '../gameObj/HumanManager'
import { CloudManagerConstrArgs } from '../gameObj/CloudManager'
import CloudManager from '../gameObj/CloudManager'
import Cloud from '../gameObj/Cloud'
import IRebound from '../interface/IRebound'
import { StarManagerConstrArg } from '../gameObj/StarManager'
import StarManager from '../gameObj/StarManager'
import ScorePanel from '../gameObj/ScorePanel'
import { ScorePanelConstrArg } from '../gameObj/ScorePanel'
import OverPage from '../pages/OverPage'
import { ClockConstrArg } from '../gameObj/Clock'
import Clock from '../gameObj/Clock'
import UFOManager from '../gameObj/UFOManager'
import UFO from '../gameObj/UFO'
import * as $ from "jquery";
interface IEachReboundFunc {
    (rebound: IRebound): void;
}
// let time = 1000
//         let clearsettime = setInterval(function(){
            
//             time <= 600 ? clearInterval(clearsettime) : time-=100;
//             // console.log(time)
//         },3000)
        
var ufoTime = 3000//ufo生成时间
        
class PlayPage extends AbstractPage {

    constructor(container: egret.DisplayObjectContainer) {
        super(container);
    }

    private scrollBg: ScrollBg;

    private humanManager: HumanManager;

    private cloudManager: CloudManager;

    private UFOManager: UFOManager;

    //分数显示对象
    private scorePanel: ScorePanel;

    /** 弹板 */
    private drawboard: Drawboard;

    /** 时钟 */
    private clock: Clock;

    private clockContainer: egret.DisplayObjectContainer;

    private drawboardContainer: egret.DisplayObjectContainer;

    private humanContainer: egret.DisplayObjectContainer;

    private bgContainer: egret.DisplayObjectContainer;

    private cloudContainer: egret.DisplayObjectContainer;

    private starContainer: egret.DisplayObjectContainer;

    private scorePanelContainer: egret.DisplayObjectContainer;

    private UFOContainer: egret.DisplayObjectContainer;

    /** 用于生成ufo的定时器 */
    private UFOCreateTimer: egret.Timer;

    /** 爬升高度 */
    private curH: number = 0;

    /** 分数 */
    private score: number = 0;
    
    public start(): Promise<any> {
        //添加PlayPage页面到容器中
        this.addToContainer();

        this.drawboardContainer = getFullSizeContainer();
        this.humanContainer = getFullSizeContainer();
        this.bgContainer = getFullSizeContainer();
        this.cloudContainer = getFullSizeContainer();
        this.starContainer = getFullSizeContainer();
        this.scorePanelContainer = getFullSizeContainer();
        this.clockContainer = getFullSizeContainer();
        this.UFOContainer = getFullSizeContainer();


        this.addChild(this.bgContainer);
        this.addChild(this.cloudContainer);
        this.addChild(this.drawboardContainer);
        this.addChild(this.humanContainer);
        this.addChild(this.starContainer);
        this.addChild(this.scorePanelContainer);
        this.addChild(this.clockContainer);
        this.addChild(this.UFOContainer);

        this.scrollBg = new ScrollBg(this.bgContainer, [getBitmap('bottomBg_png'), getBitmap('topBg_png')]);
        this.drawboard = PlayPageUtil.getDrawboard(this.drawboardContainer);
        this.drawboard.addToContainer();

        //ufo管理
        this.UFOManager = new UFOManager(this.UFOContainer, Speed.getG() * -0.5);
        this.UFOManager.addEventListener(UFOManager.E_UFO_AFTER_FRAME, this.UFOMoved, this);
        this.UFOManager.start();

        //分数面板
        let scorePanelOption: ScorePanelConstrArg;
        scorePanelOption = {
            x: 0,
            y: 0,
            score: 0,
            w: Stage.getStageW(),
            h: 80,
            color: 0xFFFFFF,
            fontSize: 40,
            textAlign: 'center'
        };
        this.scorePanel = new ScorePanel(scorePanelOption);
        this.scorePanelContainer.addChild(this.scorePanel);


        //人物管理
        let humanManagerConstrArgs: HumanManagerConstrArgs;
        humanManagerConstrArgs = {
            container: this.humanContainer,
            horizontalStatus: horizontalDirection.right,
            verticalStatus: verticalDirection.bottom,
            bm: getBitmap('br_png'),
            verticalSpeed: 0,
            maxY: 200,
            G: Speed.getG(),
            page: this
        };

        this.humanManager = new HumanManager(humanManagerConstrArgs);
        this.humanManager.addEventListener(HumanManager.E_HUMAN_FALLING, this.humanFalling, this);
        this.humanManager.addEventListener(HumanManager.E_HUMAN_REACH_TOP, this.humanReachTop, this);
        this.humanManager.addEventListener(HumanManager.E_HUMAN_REBOUND, this.humanRebound, this);
        this.humanManager.start();

        //云朵管理
        let cloudManagerConstrArgs: CloudManagerConstrArgs;
        cloudManagerConstrArgs = {
            container: this.cloudContainer,
            cloudRowSpace: 100,
            cloudStartY: 200
        };
        this.cloudManager = new CloudManager(cloudManagerConstrArgs);
        this.cloudManager.createCloudList(Stage.getStageH());

          //时钟
        let clockConstrArg: ClockConstrArg;
        clockConstrArg = {
            bm: getBitmap('clock_png'),
            container: this.clockContainer,
            x: 33,
            y: 950,
            time: 180
        };
        this.clock = new Clock(clockConstrArg);
        this.clock.addEventListener(Clock.E_CLOCK_TIME_END, this.gameOver, this);
        this.clock.start();
        var that = this;

        
        //定时生成ufo
        this.createUFO(ufoTime);
        // console.log(ufoTime)
        return Promise.resolve();
    }

    private UFOMoved(): void {
        this.UFOManager.eachAllUFO((ufo: UFO) => {
            if (PlayPageUtil.isIntersectWithUFO(this.humanManager, ufo)) {
                this.gameOver();
            }
        });
    }

    private humanReachTop(): void {
        //计算应该滚动的位置
        let cloudScrollDist: number = this.humanManager.getHumanReachDist();

        //设置cloud滚动
        this.cloudManager.scroll(cloudScrollDist);

        //记录高度
        this.curH += cloudScrollDist;

        //更新分数
        this.score = PlayPageUtil.getScore(this.curH);

        this.scorePanel.updateScore(this.score);

        //背景滚动
        this.scrollBg.scroll(PlayPageUtil.getBgScrollStep(cloudScrollDist));

        if (PlayPageUtil.isHideDrawboard(this.score, this.drawboard)) {
            this.drawboard.removeEl();
        }

    }

    private eachRebound(func: IEachReboundFunc): void {
        let cloudList = this.cloudManager.getCloudList();
        let drawboard = this.drawboard;

        cloudList.map((cloud: Cloud) => {
            func(cloud);
        });

        drawboard.getBm().parent && func(drawboard);
    }


    private testHit(): void {
        //与具备反弹能力的物体进行碰撞测试
        this.eachRebound((rebound: IRebound) => {
            let ret = rebound.hitTestPoint(this.humanManager);
            if (ret) {
                if (rebound instanceof Cloud) {
                    let cloud: Cloud = rebound as Cloud;
                    this.cloudManager.removeCloud(cloud);
                    this.cloudDestoryEffect(cloud.getX() + cloud.getW() / 2, cloud.getY() + cloud.getH() / 2);
                }
            }

        });
    }

    /**
     * 判断是否游戏结束
     */
    private testGameOver(): void {
        let humanY = this.humanManager.getHumanY();
        if (humanY > Stage.getStageH()) {
            this.gameOver();
        }
    }

    private humanFalling() {

        //碰撞测试
        this.testHit();

        this.testGameOver();
    }

    /**
     * 云朵消失特效
     */
    private cloudDestoryEffect(x: number, y: number): void {
        // let point: egret.Point = this.humanManager.getTouchPoint();
        let option: StarManagerConstrArg;
        option = {
            x: x,
            y: y,
            G: Speed.getG() / 2,
            container: this.starContainer,
            starNum: 10,
            time: Speed.frameTime * 30,
            VSpeedLimit: 15,
            HSpeedLimit: 20
        };
        let starGroup = new StarManager(option);
        starGroup.start();
    }


    private humanRebound() {
        let cloudScrollDist = this.humanManager.getCloudScrollDist();



        if (cloudScrollDist > 0) {
            this.cloudManager.createCloudList(cloudScrollDist);
        }
        this.cloudManager.delScrolledCloud(true);
    }



    private createUFO( time : number): void {
        
        this.UFOCreateTimer = new egret.Timer(time, 0);
        console.log(time)
        this.UFOCreateTimer.addEventListener(egret.TimerEvent.TIMER, this.createUFOTimerHandler, this);
        this.UFOCreateTimer.start();

    }

    private createUFOTimerHandler(): void {
        let humanTouchPoint: egret.Point = this.humanManager.getTouchPoint();
        this.UFOManager.delScrolledUFO();
        this.UFOManager.createRedUFO(humanTouchPoint.x);
            if(this.clock['time'] == 170){
                ufoTime = 2800
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 160){
                ufoTime = 2600
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 150){
                ufoTime = 2400
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
                
            }else if(this.clock['time'] == 140){
                ufoTime = 2200
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 130){
                ufoTime = 2000
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 120){
                ufoTime = 1800
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 110){
                ufoTime = 1600
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 100){
                ufoTime = 1400
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 90){
                ufoTime = 1200
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 80){
                ufoTime = 1000
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 70){
                ufoTime = 900
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 60){
                ufoTime = 800
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 50){
                ufoTime = 700
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 40){
                ufoTime = 600
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 30){
                ufoTime = 500
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 20){
                ufoTime = 400
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }else if(this.clock['time'] == 10){
                ufoTime = 300
                this.UFOCreateTimer.stop()
                this.createUFO(ufoTime);
                console.log(ufoTime)
            }
            // console.log(this.clock['time'])
            
        // console.log(this.clock[])
    }



    private async gameOver() {
        // await this.destroy();
        this.stop();
        let page: AbstractPage = new OverPage(this.getContainer(), this.score);
        await page.start();
        this.destroy();
    }

    public stop(): void {
        this.humanManager.removeEventListener(HumanManager.E_HUMAN_FALLING, this.humanFalling, this);
        this.humanManager.removeEventListener(HumanManager.E_HUMAN_REACH_TOP, this.humanReachTop, this);
        this.humanManager.removeEventListener(HumanManager.E_HUMAN_REBOUND, this.humanRebound, this);
        this.humanManager.destroy();

        //停止ufo生成
        this.UFOCreateTimer.stop();

        //停止ufo移动
        this.UFOManager.stop();
        this.UFOManager.removeEventListener(UFOManager.E_UFO_AFTER_FRAME, this.UFOMoved, this);

        this.drawboard.stop();

        this.clock.stop();
        this.clock.removeEventListener(Clock.E_CLOCK_TIME_END, this.gameOver, this);
    }

    /**
     * 销毁 
     */
    public destroy(): Promise<any> {
        // alert($)
        console.log('分数'+this.scorePanel['score'])//分数
        console.log('剩余时间'+this.clock['time'])//剩余时间
        var dataList = {
            token:sessionStorage.getItem('userToken'),
                score:this.scorePanel['score'],
                create_time:sessionStorage.getItem('creatTime'),
                end_time:180-this.clock['time']
        },that = this,statusHint = '',
        hint = '网络错误，无法发送您的分数，请确认网络连接正常后点击确认重新发送分数！',
        popHtml = `<div id="pop" style="position: fixed;left: 0;top: 0;bottom: 0;right: 0; z-index: 100;">
        <div style="position: absolute;top: 50%;left: 50%;color: #fff;text-align: center;background-color:rgba(0,0,0,.5);border-radius: 10px;
        transform: translate(-50%, -50%);margin: 0 auto;">
            <div style="padding:10px 20px;">
                    <span id="hint">${hint}</span>
                <div>
                    <button style="margin-right:10px;background: #7c00a8;color: #fff;outline: none;border: none;padding:5px 15px;" onclick="pop.style.display = 'none'">取消</button>
                    <button style="background: #7c00a8;color: #fff;outline: none;border: none;padding:5px 15px;" id="queren">确定</button>
                </div>
            </div>
        </div>
    </div>`,
    successHint = `<div id="pop" style="position: fixed;left: 0;top: 0;bottom: 0;right: 0; z-index: 10000;">
        <div class="send-success">
                <img src="./libs/modules/close.png" alt="" onclick="closePop()" class="close-img">
            <div style="padding:10px 20px;">
                    <p id="hint">发送分数成功！</p>
                    <span style="font-size:14px;color:#fff;border-bottom:1px solid #fff;display: inline-block;line-height: 1.2;" onclick="lookRanking()">查看排行榜</span>
                <div>
                </div>
            </div>
        </div>
</div>`,
errorHint = `<div id="pop" style="position: fixed;left: 0;top: 0;bottom: 0;right: 0; z-index: 10000;">
    <div style="position: absolute;top: 50%;left: 50%;color: #fff;text-align: center;background-color:rgba(0,0,0,.5);border-radius: 10px;
    transform: translate(-50%, -50%);margin: 0 auto;">
        <div style="padding:10px 20px;">
                <span id="hint">用户编号错误，发送分数失败！</span>
            <div>
            </div>
        </div>
    </div>
</div>`;
            sessionStorage.setItem('dataList',JSON.stringify((dataList)))
        sendD()
        function sendD(){
            // alert(123)
            document.getElementById('newload').style.display = 'block'
            $.ajax({
                url: 'https://cjp.xiaohucloud.com/api/api_update_game',
                type: "POST",
                dataType: "json",
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                data: dataList,
                success: function (res) {
                    if(res.code === 1){
                        
                        // statusHint = '编号错误，无法上传您的分数！';
                        document.getElementById('newload').style.display = 'none'
                        document.getElementById('pophtml').style.display = 'block'
                            document.getElementById('pophtml').innerHTML = errorHint
                            setTimeout(function(){document.getElementById('pophtml').style.display = 'none'},2000)
                            console.log(dataList)
                        // document.getElementById('queren').onclick = sendD
                        
                    }else{
                        // alert('发送分数成功！')
                        document.getElementById('newload').style.display = 'none'
                        document.getElementById('pophtml').style.display = 'block'
                        document.getElementById('pophtml').innerHTML = successHint
                        // setTimeout(function(){document.getElementById('pophtml').style.display = 'none'},1500)
                    }
                },
                error: function (err) {
                    // alert('网络错误，无法发送您的分数，请确认是否有网络连接！')
                    // hint = '网络错误，无法发送您的分数，请确认网络连接正常后点击确认重新发送分数！';
                    document.getElementById('pophtml').style.display = 'block'
                    document.getElementById('pophtml').innerHTML = popHtml
                    document.getElementById('queren').onclick = sendD
                    document.getElementById('newload').style.display = 'none'
                    // var r=confirm("网络错误，无法发送您的分数，请确认网络连接正常后点击确认重新发送分数！")
                    // if(r){
                    //     sendD()
                    // }else{
                    //     console.log(dataList)
                    // }
                }
            })
        }
        
        
        function aaa(){
            alert(123)
        }
        
        // $.ajax({//提交编号返回token
        //     url: 'https://cjp.xiaohucloud.com/api/api_validate_ticket_id',
        //     type: "POST",//
        //     dataType: "json",
        //     headers: { 'content-type': 'application/x-www-form-urlencoded' },
        //     data: {
        //         ticket_id:'133523'
        //     },
        //     success: function (res) {
        //         console.log(res.data.token);
        //         sessionStorage.setItem('userToken', res.data.token);
        //         if(res.data.token == ''){
        //             alert('编号错误')
        //             return false
        //         }
        //         // zhezhao.style.display = 'none'
        //     },
        //     error: function (err) {
        //         console.log(err)
        //     }

        // })
        ufoTime = 3000
       
        this.removeEl();
        return Promise.resolve();
    }
}

export default PlayPage;