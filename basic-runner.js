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
  visual(lesson, items, vars={}) { const c=this.ctx,w=this.canvas.width,h=this.canvas.height; c.clearRect(0,0,w,h); c.fillStyle='#f4f8f8'; c.fillRect(0,0,w,h); c.fillStyle='#167c80'; c.font='bold 22px Microsoft YaHei'; c.fillText(`Exercise ${lesson.number} · ${lesson.title}`,28,42); const card=(x,y,width,height,title,rows)=>{c.fillStyle='#fff';c.strokeStyle='#cde2da';c.lineWidth=1;c.roundRect(x,y,width,height,10);c.fill();c.stroke();c.fillStyle='#173042';c.font='bold 15px Microsoft YaHei';c.fillText(title,x+16,y+27);c.font='14px Consolas';c.fillStyle='#45606b';rows.forEach((row,i)=>c.fillText(String(row),x+16,y+55+i*25));}; const variableRows=Object.entries(vars).map(([k,v])=>`${k} = ${v}`); const outputRows=items.filter(x=>!String(x).startsWith('注释：')).slice(-5); card(28,90,220,220,'当前代码步骤',items.slice(0,6)); card(270,90,220,220,'变量状态',variableRows.length?variableRows:['暂无变量']); card(512,90,215,220,'输出结果',outputRows.length?outputRows:['等待运行']); }
  }
}
window.BasicRunner=BasicRunner;
