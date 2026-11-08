class PythonRunner {
  constructor(simulator) { this.simulator=simulator; this.pyodide=null; this.ready=false; }
  async load(onStatus) { if(!window.loadPyodide){ onStatus('演示模式'); return; } try { onStatus('正在加载 Python…'); this.pyodide=await loadPyodide(); this.ready=true; onStatus('Python 已就绪'); } catch(e) { onStatus('演示模式'); } }
  async run(source) { this.simulator.reset(); const logs=[]; const simulated=await this.fallback(source,logs); return simulated.ok?{...simulated,warning:'教学模拟器支持函数、if / else 和 time.sleep。'}:simulated; }
  async fallback(source,logs) {
    const sim=this.simulator; source=source.replace(/for i in range\\((\\d+)\\):\\n((?:    .*\\n?)+)/g,(_,n,body)=>Array(Number(n)).fill(body.replace(/^    /gm,"")).join("\\n")); const raw=source.split(/\\r?\\n/); const lines=raw.map(r=>({indent:(r.match(/^\\s*/) || [""])[0].length,text:r.trim()})).filter(x=>x.text&&!x.text.startsWith("#")&&x.text!=="import time"); const funcs=new Map(); let distance=null,ran=false;
    for(let i=0;i<lines.length;i++){if(/^def \w+\(\):$/.test(lines[i].text)){const name=lines[i].text.match(/^def (\w+)/)[1],body=[];let j=i+1;while(j<lines.length&&lines[j].indent>lines[i].indent)body.push(lines[j++]);funcs.set(name,body);i=j-1;}}
    const execute=async items=>{for(let i=0;i<items.length;i++){const {text,indent}=items[i];if(text.startsWith('def ')){while(i+1<items.length&&items[i+1].indent>indent)i++;continue;}if(/^distance\s*=\s*sensor\.distance\(\)\s*(?:#.*)?$/.test(text)){distance=sim.readDistance();logs.push(`sensor.distance() → ${distance} cm`);ran=true;continue;}const cond=text.match(/^if\s+distance\s*<\s*(\d+):/);if(cond){let yes=[],no=[],j=i+1;while(j<items.length&&items[j].indent>indent&&items[j].text!=='else:')yes.push(items[j++]);if(j<items.length&&items[j].text==='else:'){j++;while(j<items.length&&items[j].indent>indent)no.push(items[j++]);}await execute(distance!==null&&distance<Number(cond[1])?yes:no);i=j-1;continue;}const wait=text.match(/^time\.sleep\(([^)]*)\)/);if(wait){const sec=Math.max(0,Number(wait[1])||0);logs.push(`等待 ${sec} 秒`);await new Promise(r=>setTimeout(r,sec*1000));continue;}const call=text.match(/^(?:car\.)?(forward|backward|left|right)\(\s*([^)]*)\)\s*(?:#.*)?$/);if(call){await api(call[1],Number(call[2])||undefined);ran=true;continue;}if(/^car\.stop\(\)\s*(?:#.*)?$/.test(text)){sim.stop();logs.push('car.stop()');ran=true;continue;}const fn=text.match(/^(\w+)\(\)\s*(?:#.*)?$/);if(fn&&funcs.has(fn[1]))await execute(funcs.get(fn[1]));}};
    await execute(lines); return ran?{ok:true,logs}:{ok:false,error:'没有找到可执行的小车指令。'};
    async function api(name,val){if(name==='forward')await sim.forward(val);if(name==='backward')await sim.backward(val);if(name==='left')sim.left(val);if(name==='right')sim.right(val);logs.push(`car.${name}(${val??''})`);}
  }
}
window.PythonRunner=PythonRunner;






