class PythonRunner {
  constructor(simulator) { this.simulator = simulator; }
  async load(onStatus) { onStatus('教学模拟器已就绪'); }
  async run(source) { this.simulator.reset(); const logs = []; const result = await this.execute(source, logs); if (!result.ran) return { ok: false, error: '没有找到可执行的小车指令。请保留 car.forward()、car.left() 或 car.stop()。'}; return { ok: true, logs, warning: '教学模拟器已按代码顺序执行。' }; }
  async execute(source, logs) {
    const lines = source.split(/\r?\n/).map(raw => ({ indent: (raw.match(/^\s*/) || [''])[0].length, text: raw.trim() })).filter(line => line.text && !line.text.startsWith('#') && line.text !== 'import time');
    const functions = new Map();
    for (let i = 0; i < lines.length; i++) { const match = lines[i].text.match(/^def\s+(\w+)\(\):$/); if (!match) continue; const body = []; let j = i + 1; while (j < lines.length && lines[j].indent > lines[i].indent) body.push(lines[j++]); functions.set(match[1], body); i = j - 1; }
    let distance = null; let ran = false;
    const runLines = async items => { for (let i = 0; i < items.length; i++) { const line = items[i]; const text = line.text;
      if (text.startsWith('def ')) { while (i + 1 < items.length && items[i + 1].indent > line.indent) i++; continue; }
      const loop = text.match(/^for\s+\w+\s+in\s+range\((\d+)\):$/); if (loop) { const body = []; let j = i + 1; while (j < items.length && items[j].indent > line.indent) body.push(items[j++]); for (let n = 0; n < Number(loop[1]); n++) { logs.push(`搜索第 ${n + 1} 次`); await runLines(body); } i = j - 1; continue; }
      if (/^distance\s*=\s*sensor\.distance\(\)/.test(text)) { distance = this.simulator.readDistance(); logs.push(`sensor.distance() → ${distance} cm`); ran = true; continue; }
      const condition = text.match(/^if\s+distance\s*<\s*(\d+):$/); if (condition) { const yes = []; const no = []; let j = i + 1; while (j < items.length && items[j].indent > line.indent && items[j].text !== 'else:') yes.push(items[j++]); if (j < items.length && items[j].text === 'else:') { j++; while (j < items.length && items[j].indent > line.indent) no.push(items[j++]); } await runLines(distance !== null && distance < Number(condition[1]) ? yes : no); i = j - 1; continue; }
      const sleep = text.match(/^time\.sleep\(([^)]*)\)/); if (sleep) { const seconds = Math.max(0, Number(sleep[1]) || 0); logs.push(`等待 ${seconds} 秒`); await new Promise(resolve => setTimeout(resolve, seconds * 1000)); continue; }
      const action = text.match(/^car\.(forward|backward|left|right)\(\s*([0-9.]*)\s*\)/); if (action) { const value = Number(action[2]) || undefined; if (action[1] === 'forward') await this.simulator.forward(value); if (action[1] === 'backward') this.simulator.backward(value); if (action[1] === 'left') this.simulator.left(value); if (action[1] === 'right') this.simulator.right(value); logs.push(`car.${action[1]}(${value ?? ''})`); ran = true; continue; }
      if (/^car\.stop\(\)/.test(text)) { this.simulator.stop(); logs.push('car.stop()'); ran = true; continue; }
      const call = text.match(/^(\w+)\(\)$/); if (call && functions.has(call[1])) await runLines(functions.get(call[1]));
    } };
    await runLines(lines); return { ran };
  }
}
window.PythonRunner = PythonRunner;
