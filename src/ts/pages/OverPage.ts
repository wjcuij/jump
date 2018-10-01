import AbstractPage from '../interface/AbstractPage'
import * as Stage from '../util/Stage'
import * as RESUtil from '../util/RES'
import * as Util from '../util/common'
import PlayPage from './PlayPage'

var label:egret.TextField = new egret.TextField(); 
label.text = "排行榜内即可获取3D打印月亮奖品，关注“盈富永泰集团”公众号，发送”中秋游戏“关键字，扫描二维码进入小程序查看排行榜有没有你的名字吧！"; 
label.width = 480;
label.textColor = 0xf8e847;
label.fontFamily = "微软雅黑";
label.size = 24; 
label.y = 550; 
label.x = 100; 

class OverPage extends AbstractPage {
    constructor(container: egret.DisplayObjectContainer, score: number) {
        super(container);
        this.score = score;
        this.initBg();
        this.initReplayBtn();
        this.initScoreBmArr();
    }

    private bg: egret.Bitmap;

    private scoreBmArr: Array<egret.Bitmap> = [];

    private replayBtn: egret.Bitmap;

    private score: number;

    private initBg(): void {
        let bm: egret.Bitmap = RESUtil.getBitmap('overBg_png');
        this.addChild(bm);
        this.addChild( label );
    }


    private getTextureByNum(num: number): egret.Texture {
        return RESUtil.getTexture(`number.num_${num}_png`);
    }

    private initScoreBmArr(): void {
        let top = 240;
        let left = 75;
        let numW = 95;
        let numSpace = 5;
        //5位数
        let num_5 = new egret.Bitmap;
        //4为数
        let num_4 = new egret.Bitmap;

        let num_3 = new egret.Bitmap;

        let num_2 = new egret.Bitmap;

        let num_1 = new egret.Bitmap;

        this.scoreBmArr.push(num_5);
        this.scoreBmArr.push(num_4);
        this.scoreBmArr.push(num_3);
        this.scoreBmArr.push(num_2);
        this.scoreBmArr.push(num_1);

        let maxScore: any = Math.min(99999, this.score);
        maxScore = Util.fixZero(maxScore, 5); //转为带'0'的字符串

        this.scoreBmArr.map((bm, index) => {
            bm.y = top;
            bm.x = left + (numW + numSpace) * index;
            let num: string = maxScore[index];
            let n: number = parseInt(num);
            bm.texture = this.getTextureByNum(n);
            this.addChild(bm);
        });
    }

    private initReplayBtn(): void {
        let btnReplay = RESUtil.getBitmap('replayBtn_png');
        let stateW = Stage.getStageW();
        let textureW = btnReplay.texture.textureWidth;
        btnReplay.x = (stateW - textureW) / 2;
        btnReplay.y = 400;//重新玩按钮位置
        btnReplay.touchEnabled = true;
        btnReplay.addEventListener(egret.TouchEvent.TOUCH_TAP, this.replayHandler, this);
        this.addChild(btnReplay);
        this.replayBtn = btnReplay;
    }

    private async replayHandler(): Promise<any> {//点击重新开始
        await this.destroy();
        let playPage: AbstractPage = new PlayPage(this.getContainer());
        playPage.start();
        // alert(123)
    }

    private removeEvent(): void {
        this.replayBtn.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.replayHandler, this);
    }

    public destroy(): Promise<any> {
        this.removeEvent();
        this.removeEl();
        return Promise.resolve();
    }

    public start(): Promise<any> {
        let container = this.getContainer();
        container.alpha = 0;
        this.addToContainer();
        let tw = egret.Tween.get(container);
        let p = new Promise((resolve, reject) => {
            tw.to({ alpha: 1 }, 300).call(() => {
                resolve();
            });
        });
        return p;
    }
}

export default OverPage;