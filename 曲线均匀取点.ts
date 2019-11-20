/**
 * 本示例采用非脚本的方式实现，而使用继承页面基类，实现页面逻辑。在IDE里面设置场景的Runtime属性即可和场景进行关联
 * 相比脚本方式，继承式页面类，可以直接使用页面定义的属性（通过IDE内var属性定义），比如this.tipLbll，this.scoreLbl，具有代码提示效果
 * 建议：如果是页面级的逻辑，需要频繁访问页面内多个元素，使用继承式写法，如果是独立小模块，功能单一，建议用脚本方式实现，比如子弹脚本。
 */
export default class EditorView extends Laya.Scene {
    constructor() {
        super();
    }
    sp: Laya.Sprite = null;
    //三个控制点 
    p1: Laya.Vector2;
    p2: Laya.Vector2;
    p3: Laya.Vector2;
    p4: Laya.Vector2;
    ax: number = 0;
    ay: number = 0;
    bx: number = 0;
    by: number = 0;
    cx: number = 0;
    cy: number = 0;

    A: number = 0;
    B: number = 0;
    C: number = 0;


    //曲线总长度  
    total_length: number = 0.0;
    //曲线分割的份数  
    STEP: number = 20;
    //用于保存绘制点数据的数组 
    pixels: Laya.Vector2[];

    weight: any[] = [
        { w: 0.5688888888888889, x: 0.0000000000000000 },
        { w: 0.4786286704993665, x: -0.5384693101056831 },
        { w: 0.4786286704993665, x: 0.5384693101056831 },
        { w: 0.2369268850561891, x: -0.9061798459386640 },
        { w: 0.2369268850561891, x: 0.9061798459386640 },
    ]


    onAwake() {
        this.setBezier(
            new Laya.Vector2(100, 300),
            new Laya.Vector2(150, 100),
            new Laya.Vector2(250, 100),
            new Laya.Vector2(300, 300)
        );
    }

    setBezier(p1: Laya.Vector2, p2: Laya.Vector2, p3: Laya.Vector2, p4: Laya.Vector2) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
        this.initData();
        this.initPath();
        this.drawPath();
    }

    initData() {
        // this.ax = this.p1.x - 2 * this.p2.x + this.p3.x;
        // this.ay = this.p1.y - 2 * this.p2.y + this.p3.y;
        // this.bx = 2 * this.p2.x - 2 * this.p1.x;
        // this.by = 2 * this.p2.y - 2 * this.p1.y;
        this.pixels = new Array(this.STEP);

        this.ax = -3 * this.p1.x + 9 * this.p2.x - 9 * this.p3.x + 3 * this.p4.x;
        this.ay = -3 * this.p1.y + 9 * this.p2.y - 9 * this.p3.y + 3 * this.p4.y;

        this.bx = 6 * this.p1.x - 12 * this.p2.x + 6 * this.p3.x;
        this.by = 6 * this.p1.y - 12 * this.p2.y + 6 * this.p3.y;

        this.cx = -3 * this.p1.x + 3 * this.p2.x;
        this.cy = -3 * this.p1.y + 3 * this.p2.y;

        this.A = -3 * this.p1.x;
        this.B = 4 * (this.ax * this.bx + this.ay * this.by);
        this.C = this.bx * this.bx + this.by * this.by;
    }
    //-------------------------------------------------------------------------------------  
    //计算出所有的点
    initPath() {
        //计算总长度  
        this.total_length = this.L(1);
        this.STEP = parseInt((this.total_length / 30).toString());
        for (var nIndex = 0; nIndex < this.STEP; nIndex++) {
            if (nIndex >= 0 && nIndex <= this.STEP) {
                let t: number = nIndex / this.STEP;
                //如果按照线形增长,此时对应的曲线长度  
                let l: number = t * this.total_length;
                //根据L函数的反函数，求得l对应的t值  
                t = this.InvertL(t, l);
                //根据贝塞尔曲线函数，求得取得此时的x,y坐标  
                let x: number = (1 - t) * (1 - t) * this.p1.x + 2 * (1 - t) * t * this.p2.x + t * t * this.p3.x;
                let y: number = (1 - t) * (1 - t) * this.p1.y + 2 * (1 - t) * t * this.p2.y + t * t * this.p3.y;
                //取整  
                this.pixels[nIndex] = new Laya.Vector2();
                this.pixels[nIndex].x = Math.floor(x + 0.5);
                this.pixels[nIndex].y = Math.floor(y + 0.5);
            }
        }
    }
    //-------------------------------------------------------------------------------------  
    //绘制出所有的点
    drawPath() {
        if (!this.sp) {
            this.sp = new Laya.Sprite();
            Laya.stage.addChild(this.sp);
        }
        let ctx = this.sp.graphics;
        for (let i = 0; i < this.STEP; i++) {
            let p = this.pixels[i];
            ctx.drawCircle(p.x, p.y, 10, "#ff0000");
        }
        console.log(this.pixels);
    }
    //-------------------------------------------------------------------------------------  
    //速度函数  
    /*
     * s(t_) = Sqrt[A*t*t+B*t+C] 
     */
    s(t: number): number {
        // let t2 = 0.5 * t;
        // let t3 = t2 * this.weight[i].x + t2;
        let tx = this.ax * t * t + this.bx * t + this.cx;
        let ty = this.ay * t * t + this.by * t + this.cy;
        return Math.sqrt(tx*tx + ty*ty);
    }
    //-------------------------------------------------------------------------------------  
    //长度函数  
    /* 
        L(t) = Integrate[s[t], t]  
        L(t_) = ((2*Sqrt[A]*(2*A*t*Sqrt[C + t*(B + A*t)] + B*(-Sqrt[C] + Sqrt[C + t*(B + A*t)])) +       
            (B^2 - 4*A*C) (Log[B + 2*Sqrt[A]*Sqrt[C]] - Log[B + 2*A*t + 2 Sqrt[A]*Sqrt[C + t*(B + A*t)]])) 
                /(8* A^(3/2))); 
    */
    L(t: number): number {
        let l = 0;
        let t2 = 0.5 * t;
        for (let i = 0; i < 5; i++) {
            let t3 = t2 * this.weight[i].x + t2;
            let tx = this.ax * t3 * t3 + this.bx * t3 + this.cx;
            let ty = this.ay * t3 * t3 + this.by * t3 + this.cy;
            l += Math.sqrt(tx * tx + ty * ty) * this.weight[i].w;
        }
        l = l * t2;
        return l;
    }



    //------------------------------------------------------------------------------------- 
    //长度函数反函数，使用牛顿切线法求解  
    /*
        X(n+1) = Xn - F(Xn)/F'(Xn) 
     */
    InvertL(t: number, l: number): number {
        let t1: number = t, t2: number;
        do {
            t2 = t1 - (this.L(t1) - l) / this.s(t1);
            if (Math.abs(t1 - t2) < 0.000001) {
                break;
            }
            t1 = t2;
        } while (true);
        return t2;
    }
}