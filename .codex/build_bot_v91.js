const fs = require('fs');

const sourcePath = 'C:/Users/tetiana.flora/Downloads/ViknaStyle_TG_Portal_Bot_v90_portal_analytics_v2_20260909.json';
const reportPath = 'C:/Users/tetiana.flora/Downloads/TG bot notification portal.json';
const outputPath = 'C:/Users/tetiana.flora/Downloads/ViknaStyle_TG_Portal_Bot_v91_complete_analytics_dynamic_filters_20260909.json';
const workflow = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const reportWorkflow = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const byName = name => workflow.nodes.find(node => node.name === name);

workflow.name = 'ViknaStyle TG Portal Bot v91 - Complete Analytics and Dynamic Filters';
workflow.versionId = 'fbe19191-2026-4909-9191-202609090091';

const resolver = byName('Resolve dashboard actions');
resolver.parameters.jsCode = resolver.parameters.jsCode.replace(
  'return [item];',
  `const analyticsPeriods={'📈 7 днів':'7d','📈 30 днів':'30d','📈 Цей місяць':'month0','📈 Попередній місяць':'month1'};
state.analyticsPeriods=state.analyticsPeriods||{};state.additionalStatuses=state.additionalStatuses||{};
const navState=state.portalBotState?.[chat];const callback=String(update.callback_query?.data||'');
if(navState&&callback.startsWith('reclamation_')){navState.section='reclamations';navState.reclamation_view='results';}
if(navState&&callback.startsWith('additional_order_')){navState.section='additional_orders';}
if(text==='📈 Аналітика порталу'){item.json.action='order_periods';item.json.analytics_menu=true;delete item.json.analytics;}
else if(analyticsPeriods[text]){const selected=analyticsPeriods[text];item.json.action='daily';item.json.analytics_report=true;item.json.analytics_period=selected;item.json.analytics_group=selected==='7d'?'day':'week';state.analyticsPeriods[chat]=selected;delete item.json.analytics;}
else if(text==='➕ Дозамовлення'){item.json.action='additional_orders';item.json.additional_filter_menu=true;state.additionalStatuses[chat]='all';}
else if(/^➕ Усі дозамовлення(?: \\(\\d+\\))?$/.test(text)){item.json.action='additional_orders';item.json.additional_filter_status='all';state.additionalStatuses[chat]='all';}
else if(/^➕ Статус: /.test(text)){const selected=text.replace(/^➕ Статус: /,'').replace(/ \\(\\d+\\)$/,'').trim();item.json.action='additional_orders';item.json.additional_filter_status=selected;state.additionalStatuses[chat]=selected;}
else if(item.json.action==='additional_orders'){item.json.additional_filter_status=state.additionalStatuses[chat]||'all';}
return [item];`,
);

const periods = byName('Format order periods');
periods.parameters.jsCode = periods.parameters.jsCode.replace(
  "const chat_id=$('Parse portal command').first().json.chat_id;",
  "const chat_id=$('Parse portal command').first().json.chat_id;\nif(action.analytics_menu)return [{json:{chat_id,text:'<b>📈 Аналітика відвантажень</b>\\nОберіть період:',reply_markup:{keyboard:[['📈 7 днів','📈 30 днів'],['📈 Цей місяць','📈 Попередній місяць'],['⬅️ Назад','🏠 Головне меню']],resize_keyboard:true,one_time_keyboard:false,is_persistent:true}}}];",
);

const loadDaily = byName('Load daily report');
const originalUrl = loadDaily.parameters.url.trim();
const originalExpression = originalUrl.startsWith('={{') ? originalUrl.slice(3, -2).trim() : originalUrl;
loadDaily.parameters.url = `={{ $('Resolve dashboard actions').item.json.analytics_report ? $('Config').item.json.portal_url + '/api/telegram-bot/shipped-analytics/?chat_id=' + $('Parse portal command').item.json.chat_id + '&period=' + $('Resolve dashboard actions').item.json.analytics_period : (${originalExpression}) }}`;

const analyticsIf = byName('Is portal analytics request?');
analyticsIf.parameters.conditions.conditions[0].leftValue = "={{ $('Resolve dashboard actions').item.json.analytics_report }}";

const sourceBuilder = reportWorkflow.nodes.find(node => node.name === 'Build Shipped HTML');
const builder = byName('Build Shipped HTML');
builder.parameters.jsCode = sourceBuilder.parameters.jsCode
  .replace(
    'const trends = rows(report.DailyTrend);',
    `const rawTrends = rows(report.DailyTrend);
const grouping = $('Resolve dashboard actions').first().json.analytics_group || 'day';
const monday = value => {const d=new Date(String(value).slice(0,10)+'T00:00:00Z');const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-day+1);return d.toISOString().slice(0,10)};
const trends = grouping==='week' ? [...rawTrends.reduce((map,row)=>{const key=monday(row.Date);const current=map.get(key)||{...row,Date:key,Name:'Тиждень '+key,TotalAmount:0,OrdersCount:0,ConstructionsCount:0,Quantity:0};for(const field of ['TotalAmount','OrdersCount','ConstructionsCount','Quantity'])current[field]=Number(current[field]||0)+Number(row[field]||0);map.set(key,current);return map},new Map()).values()] : rawTrends;`,
  )
  .replace('chat_id: 716230412,', "chat_id: $('Parse portal command').first().json.chat_id,")
  .replace("`${trends.length} днів`, bars(trends, 'TotalAmount', ' ₴')", "`${trends.length} ${grouping==='week'?'тижнів':'днів'}`, bars(trends, 'TotalAmount', ' ₴')")
  .replace("const reportVersion = '14';", "const reportVersion = '15';");

const normalizeNode = {
  parameters: {
    jsCode: "const item=$input.first();const report=item.binary?.report;if(!report)throw new Error('HTML report binary is missing');item.json.chat_id=$('Parse portal command').first().json.chat_id;item.json.caption=item.json.caption||'📈 Аналітика відвантажень';item.binary.data={...report,fileName:report.fileName||'shipped-analytics.html'};return [item];",
  },
  id: '9a2877c1-6e72-4f7e-9159-202609090091',
  name: 'Prepare shipped analytics document',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [523888, -20944],
};

const dynamicFilterNode = {
  parameters: {
    jsCode: "const rows=Array.isArray($json.additional_orders)?$json.additional_orders:[];const action=$('Resolve dashboard actions').first().json;const chat_id=$('Parse portal command').first().json.chat_id;const counts=new Map();for(const row of rows){const status=String(row.status||'Без статусу').trim();counts.set(status,(counts.get(status)||0)+1)}const buttons=[...counts.entries()].sort((a,b)=>a[0].localeCompare(b[0],'uk')).map(([status,count])=>[`➕ Статус: ${status} (${count})`]);const keyboard=[];for(let i=0;i<buttons.length;i+=2)keyboard.push(buttons.slice(i,i+2).flat());keyboard.unshift([`➕ Усі дозамовлення (${rows.length})`]);keyboard.push(['⬅️ Назад','🏠 Головне меню']);const wanted=action.additional_filter_status||'all';const filtered=wanted==='all'?rows:rows.filter(row=>String(row.status||'Без статусу').trim()===wanted);return [{json:{...$json,additional_orders:filtered,show_filter_menu:!!action.additional_filter_menu,chat_id,text:'<b>➕ Дозамовлення</b>\\nОберіть статус:',reply_markup:{keyboard,resize_keyboard:true,one_time_keyboard:false,is_persistent:true}}}];",
  },
  id: '3145bf42-69af-4cec-9159-202609090092',
  name: 'Build dynamic additional order filters',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [523328, -22776],
};

const dynamicFilterIf = {
  parameters: {
    conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: '={{ $json.show_filter_menu }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' },
    options: {},
  },
  id: 'f307b71f-7334-4af4-9159-202609090093',
  name: 'Is additional filter menu?',
  type: 'n8n-nodes-base.if',
  typeVersion: 2.2,
  position: [523440, -22776],
};

workflow.nodes.push(normalizeNode, dynamicFilterNode, dynamicFilterIf);

workflow.connections['Is portal analytics request?'].main[0] = [{ node: 'Build Shipped HTML', type: 'main', index: 0 }];
workflow.connections['Build Shipped HTML'] = { main: [[{ node: 'Prepare shipped analytics document', type: 'main', index: 0 }]] };
workflow.connections['Prepare shipped analytics document'] = { main: [[{ node: 'Send daily HTML report', type: 'main', index: 0 }]] };

workflow.connections['Load portal additional orders'] = { main: [[{ node: 'Build dynamic additional order filters', type: 'main', index: 0 }]] };
workflow.connections['Build dynamic additional order filters'] = { main: [[{ node: 'Is additional filter menu?', type: 'main', index: 0 }]] };
workflow.connections['Is additional filter menu?'] = { main: [
  [{ node: 'Prepare Telegram message', type: 'main', index: 0 }],
  [{ node: 'Format additional orders', type: 'main', index: 0 }],
] };

// Any formatter that creates a secondary navigation keyboard must actually send it.
for (const node of workflow.nodes) {
  if (!node.parameters?.jsCode?.includes('order_navigation_keyboard')) continue;
  const connection = workflow.connections[node.name] || { main: [[]] };
  connection.main ||= [[]];
  connection.main[0] ||= [];
  if (!connection.main[0].some(target => target.node === 'Restore order navigation keyboard')) {
    connection.main[0].push({ node: 'Restore order navigation keyboard', type: 'main', index: 0 });
  }
  workflow.connections[node.name] = connection;
}

// Back from the analytics period screen always returns to the main menu.
const parser = byName('Parse portal command');
parser.parameters.jsCode = parser.parameters.jsCode.replace(
  "else if(text==='📊 Звіт за сьогодні'){\n  action='daily';\n}",
  "else if(text==='📊 Звіт за сьогодні'){\n  action='daily';\n}",
);

fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2) + '\n', 'utf8');
console.log(outputPath);
