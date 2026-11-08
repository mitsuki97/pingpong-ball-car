class BasicRunner {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); }
  async run(source, lesson) {
    const logs=[]; const vars={}; const lines=source.split(/\r?\n/).map(x=>x.trim()).filter(Boolean); let ran=false;
    if (lesson.type==='setup') { this.visual('准备工作', ['确认 Python 环境','打开编辑器','运行第一个文件']); return {ok:true,logs:['Exercise 0：准备工作清单已完成。']}; }
    for (const line of lines) {
      if (line.startsWith('#')) { logs.push('注释：程序会忽略这一行'); ran=true; continue; }
      const print=line.match(/^print\((.*)\)$/); if(print){ let raw=print[1]; let value=raw.replace(/^f?["']|["']$/g,''); value=value.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??''); value=value.replace(/\b[a-zA-Z_]\w*\b/g,k=>vars[k]??k); if(/^[\d\s+\-*/%.]+$/.test(value)){try{value=Function(`"use strict"; return (${value})`)();}catch{}} logs.push(String(value)); ran=true; continue; }
      const assign=line.match(/^(\w+)\s*=\s*(.+)$/); if(assign){ const name=assign[1], expr=assign[2]; let value=expr.replace(/^['"]|['"]$/g,''); let evaluated=expr.replace(/\b[a-zA-Z_]\w*\b/g,k=>vars[k]??k); if(/^[\d\s+\-*/%.]+$/.test(evaluated)){ try{ value=Function(`"use strict"; return (${evaluated})`)(); }catch{} } vars[name]=value; logs.push(`${name} = ${value}`); ran=true; continue; }
      if(/^import\s+/.test(line)){logs.push(`已导入：${line.slice(7)}`);ran=true;}
    }
    if(!ran) return {ok:false,error:'请先输入一行 Python 代码，例如 print("Hello")。'};
    this.visual(lesson.title, Object.entries(vars).map(([k,v])=>`${k} = ${v}`).concat(logs.slice(0,4))); return {ok:true,logs,warning:'基础练习模拟器已显示代码执行结果。'};
  }
  visual(title, items){ const c=this.ctx,w=this.canvas.width,h=this.canvas.height; c.clearRect(0,0,w,h); c.fillStyle='#eef8f7'; c.fillRect(0,0,w,h); c.fillStyle='#167c80'; c.font='bold 22px Microsoft YaHei'; c.fillText(title,32,48); items.forEach((item,i)=>{const y=90+i*48;c.fillStyle='#fff';c.strokeStyle='#9dd8d2';c.roundRect(32,y,w-64,34,8);c.fill();c.stroke();c.fillStyle='#173042';c.font='15px Consolas';c.fillText(String(item),50,y+23);}); }
}
window.BasicRunner=BasicRunner;
