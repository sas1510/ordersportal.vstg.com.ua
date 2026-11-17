const number = value => new Intl.NumberFormat("uk-UA", {maximumFractionDigits:2}).format(value);
const cell = (value, counted=false, hint="") => ({value:value ?? "—", counted, hint});
const column = (key,label,highlight=false) => ({key,label,highlight});
const statusLabels={"Подтверждено":"Підтверджені","Ждем подтверждения":"Очікують підтвердження","Ждем оплати":"Очікують оплату","Ждем оплаты":"Очікують оплату"};

export function dailyMetricDetails(detail, submissions, orderTimes) {
  const key=detail.metricKey || "orders";
  const apps=submissions.applications;
  if (key === "average") {
    const seen=new Set(), rows=[];
    for (const app of apps) for (const order of app.orders || []) {
      const minutes=app.orderProcessingMinutes?.[order.guid];
      if (!Number.isFinite(minutes) || orderTimes.get(order.guid)!==minutes || seen.has(order.guid)) continue;
      seen.add(order.guid);
      rows.push({id:order.guid,dealer:cell(app.dealer),order:cell(order.number),application:cell(app.number),minutes:cell(number(minutes),true,"Входить у середнє")});
    }
    const sum=[...seen].reduce((total,guid)=>total+orderTimes.get(guid),0);
    const result=rows.length ? Math.round(sum/rows.length) : "—";
    return { title:`${detail.label} · ${result}${rows.length ? " хв" : ""}`,
      explanation:"Кожне замовлення враховане один раз. Якщо воно пов’язане з кількома заявками, беремо найкоротший інтервал від подання заявки до оформлення замовлення.",
      summary:rows.length ? `${number(sum)} хв ÷ ${rows.length} замовлень ≈ ${result} хв` : "Немає інтервалів для розрахунку.",
      columns:[column("dealer","Дилер"),column("order","Замовлення"),column("application","Заявка"),column("minutes","Час до оформлення, хв",true)],rows };
  }
  if (["orders","orderConstructions","confirmedOrders","confirmedConstructions"].includes(key)) {
    const constructions=key.endsWith("Constructions");
    const confirmed=key.startsWith("confirmed");
    let orders=key==="orders" ? submissions.formedOrders : submissions.linkedOrders;
    if (confirmed) orders=orders.filter(order=>order.confirmed);
    if (detail.statusGuid!==undefined) orders=orders.filter(order=>String(order.stateGuid || "").toUpperCase()===detail.statusGuid);
    const value=constructions ? orders.reduce((sum,order)=>sum+Number(order.constructions || 0),0) : orders.length;
    return { title:`${detail.label} · ${number(value)} ${constructions ? "конструкцій" : "замовлень"}`,
      explanation:constructions ? "Підсумовуємо підсвічену колонку «Конструкцій». Кожне замовлення враховане один раз за GUID, навіть якщо має кілька заявок." : "Кожен підсвічений номер — одне замовлення. Повторні зв’язки із заявками не збільшують кількість.",
      summary:constructions ? `Сума колонки «Конструкцій»: ${number(value)}` : `Унікальних замовлень: ${value}`,
      columns:[column("dealer","Дилер"),column("number","№ замовлення",!constructions),column("date","Дата замовлення"),column("state","Статус",confirmed || detail.statusGuid!==undefined),column("posted","Проведено"),column("constructions","Конструкцій",constructions),column("applications","Заявки"),column("manager","Менеджер")],
      rows:orders.map(order=>({id:order.guid,dealer:cell(order.dealer),number:cell(order.number,!constructions,!constructions ? "+1 замовлення" : ""),date:cell(order.date),state:cell(statusLabels[order.state] || order.state,confirmed || detail.statusGuid!==undefined),posted:cell(order.posted ? "Так" : "Ні"),constructions:cell(order.constructions,constructions),applications:cell(order.applications.map(app=>app.number).join(", ")),manager:cell(order.manager || "—")})) };
  }
  const selected=apps.filter(detail.filter || (()=>true));
  const dealers=new Set();
  const dealerCount=new Set(selected.map(app=>app.dealerGuid)).size;
  const isDealer=key==="dealers", isConstructions=key==="appConstructions";
  const value=isDealer ? dealerCount : isConstructions ? selected.reduce((sum,app)=>sum+Number(app.constructions || 0),0) : selected.length;
  const explanation=isDealer ? "Рахуємо унікальних дилерів за GUID. Підсвічено перший рядок кожного дилера; його наступні заявки не збільшують кількість дилерів." : isConstructions ? "Підсумовуємо підсвічену колонку «Конструкцій у заявці», кожну заявку враховуємо один раз." : key==="unformed" ? "Рахуємо заявки без пов’язаних замовлень. Підсвічено номер заявки та відсутність замовлень." : key==="processing" ? "Рахуємо заявки зі статусом «В обробці». Підсвічено номер заявки й відповідний статус." : "Кожен підсвічений номер — одна подана заявка, незалежно від кількості замовлень або конструкцій.";
  return {title:`${detail.label} · ${number(value)} ${isDealer ? "дилерів" : isConstructions ? "конструкцій" : "заявок"}`,explanation,
    summary:isConstructions ? `Сума колонки «Конструкцій у заявці»: ${number(value)}` : `Враховано: ${value} ${isDealer ? "унікальних дилерів" : "заявок"}`,
    columns:[column("dealer","Дилер",isDealer),column("application","№ заявки / дата подання",!isDealer && !isConstructions),...(key==="processing" ? [column("state","Статус заявки",true)] : []),column("constructions","Конструкцій у заявці",isConstructions),column("orders","Пов’язані замовлення",key==="unformed"),column("manager","Менеджер"),column("time","Час до останнього замовлення")],
    rows:selected.map(app=>{
      const first=!dealers.has(app.dealerGuid);dealers.add(app.dealerGuid);
      const state=key==="processing" ? "В обробці" : app.state || "—";
      return {id:app.guid,dealer:cell(app.dealer,isDealer && first,isDealer ? first ? "+1 дилер" : "Уже врахований вище" : ""),application:cell(`${app.number}\n${app.date || ""}`,!isDealer && !isConstructions,""),state:cell(state,key==="processing"),constructions:cell(app.constructions,isConstructions),orders:cell(app.orders.map(order=>order.number).join(", ") || "—",key==="unformed"),manager:cell([...new Set(app.orders.map(order=>order.manager).filter(Boolean))].join(", ") || "—"),time:cell(Number.isFinite(app.processingMinutes) ? Math.round(app.processingMinutes)+" хв" : "—")};
    })};
}
