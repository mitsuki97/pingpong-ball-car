class BasicRunner {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); }
  async run(source, lesson) {
    const logs=[]; const vars={}; const lines=source.split(/\r?\n/).map(x=>x.trim()).filter(Boolean); let ran=false;
    if (lesson.type==='setup') { this.visual(lesson, ['确认 Python 环境','打开编辑器','运行第一个文件'], {}); return {ok:true,logs:['Exercise 0：准备工作清单已完成。']}; }
    for (const line of lines) {
      if (line.startsWith('#')) { logs.push('注释：程序会忽略这一行'); ran=true; continue; }
      const print=line.match(/^print\((.*)\)$/); if(print){ let raw=print[1]; let value=raw.replace(/^f?["']|["']$/g,''); value=value.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??''); value=value.replace(/\b[a-zA-Z_]\w*\b/g,k=>vars[k]??k); if(/^[\d\s+\-*/%.]+$/.test(value)){try{value=Function(`"use strict"; return (${value})`)();}catch{}} logs.push(String(value)); ran=true; continue; }
      const assign=line.match(/^(\w+)\s*=\s*(.+)$/); if(assign){ const name=assign[1], expr=assign[2]; let value=expr.replace(/^['"]|['"]$/g,''); let evaluated=expr.replace(/\b[a-zA-Z_]\w*\b/g,k=>vars[k]??k); if(/^[\d\s+\-*/%.]+$/.test(evaluated)){ try{ value=Function(`"use strict"; return (${evaluated})`)(); }catch{} } vars[name]=value; logs.push(`${name} = ${value}`); ran=true; continue; }
      if(/^import\s+/.test(line)){logs.push(`已导入：${line.slice(7)}`);ran=true;}
    }
    if(!ran) return {ok:false,error:'请先输入一行 Python 代码，例如 print("Hello")。'};
    this.visual(lesson, logs, vars); return {ok:true,logs,warning:'基础练习可视化已显示执行流程和状态变化。'};
  }
  visual(lesson, items, vars={}) { const c=this.ctx,w=this.canvas.width,h=this.canvas.height; c.clearRect(0,0,w,h); c.fillStyle='#eef8f7'; c.fillRect(0,0,w,h); c.fillStyle='#167c80'; c.font='bold 22px Microsoft YaHei'; c.fillText(`Exercise ${lesson.number} · ${lesson.title}`,28,42); const node=(x,y,width,height,label,detail,active=true)=>{c.fillStyle=active?'#fff':'#e6eeee';c.strokeStyle=active?'#4db5ad':'#b7c9c9';c.lineWidth=2;c.roundRect(x,y,width,height,10);c.fill();c.stroke();c.fillStyle='#173042';c.font='bold 15px Microsoft YaHei';c.fillText(label,x+14,y+25);c.font='13px Consolas';c.fillStyle='#45606b';c.fillText(String(detail),x+14,y+48);}; const arrow=(x1,y1,x2,y2)=>{c.strokeStyle='#167c80';c.lineWidth=2;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.fillStyle='#167c80';c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-6,y2-5);c.lineTo(x2-6,y2+5);c.closePath();c.fill();};
    if(lesson.number===0){[['确认环境','可以打开编辑器'],['保存文件','.py 文件'],['运行程序','看到结果']].forEach((x,i)=>{node(34+i*240,130,200,70,x[0],x[1]);if(i<2)arrow(234+i*240,165,270+i*240,165);});}
    else if(lesson.number===1){node(35,130,200,70,'第 1 行','print(文字)');arrow(235,165,285,165);node(285,130,200,70,'执行','文字进入输出区');arrow(485,165,535,165);node(535,130,190,70,'结果','显示文字');}
    else if(lesson.number===2){node(35,110,205,70,'注释行','# 被跳过',false);arrow(240,145,300,205);node(300,180,205,70,'代码行','print(...)');arrow(505,215,565,215);node(565,180,160,70,'输出','只显示代码');}
    else if(lesson.number===3){node(35,145,175,70,'数字','2、3、6、20');arrow(210,180,275,180);node(275,145,200,70,'计算','+  -  *  /');arrow(475,180,540,180);node(540,145,185,70,'结果','5、6、42、4');}
    else if(lesson.number===4){const entries=Object.entries(vars); entries.slice(0,3).forEach((e,i)=>node(35+i*235,105,200,72,'变量盒子',`${e[0]} = ${e[1]}`));arrow(135,205,590,205);node(250,235,260,72,'计算 total','变量值相加');}
    else {node(35,115,190,72,'模板','{name} + {speed}');arrow(225,151,285,151);node(285,115,190,72,'放入变量',`${vars.name||'小车'} / ${vars.speed||30}`);arrow(475,151,535,151);node(535,115,190,72,'最终句子',items[items.length-1]||'输出结果');}
  }
}
window.BasicRunner=BasicRunner;
