import { Link } from "react-router-dom";
import { AppIcon } from "../components/Icons/AppIcon";

const number = value => new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(Number(value) || 0);
const money = (value, currency) => `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(Number(value) || 0)} ${currency || "грн"}`;

export default function DashboardV2Metrics({ meta, averageRows, period, inTimePercent, delayedPercent, averageProductionDays, onSelectStatus }) {
  const currencyRows = meta.currency_totals?.length ? meta.currency_totals : [{ currency: "грн", total_sum: meta.total_sum }];
  const stages = [
    { name: "Вчасно", count: Number(meta.in_time_count || 0), color: "green", percent: inTimePercent, hint: "серед завершених" },
    { name: "Запізнення", count: Number(meta.delayed_count || 0), color: "orange", percent: delayedPercent, hint: "серед завершених" },
    { name: "У виробництві", count: Number(meta.not_finished_count || 0), color: "muted", hint: "ще виконуються" },
  ];
  const stageTotal = stages.reduce((sum, stage) => sum + stage.count, 0);
  const percent = Math.max(0, Math.min(100, Number(inTimePercent) || 0));
  return <div className="dashboard-v2__metrics">
    <div className="dashboard-v2__period"><span className="dashboard-v2__live-dot" />Основні показники <span>{period}</span></div>
    <section className="dashboard-v2__cards" aria-label="Основні показники">
      <article className="dashboard-v2__card dashboard-v2__card--orders"><span>Замовлення</span><div className="dashboard-v2__value-row"><AppIcon name="listCalc" /><strong>{number(meta.orders_count)}</strong></div><small>у вибраному періоді</small></article>
      <article className="dashboard-v2__card dashboard-v2__card--constructions"><span>Конструкції</span><div className="dashboard-v2__value-row"><AppIcon name="windows" /><strong>{number(meta.total_constructions)}</strong></div><small>у ваших замовленнях</small></article>
      <article className="dashboard-v2__card dashboard-v2__card--average"><span>Середній чек</span><div className="dashboard-v2__money">{averageRows.length ? averageRows.map(row => <div className="dashboard-v2__value-row" key={row.currency}><AppIcon name="money" /><strong>{number(Math.round(row.avg_check))} / {row.avg_construction == null ? "—" : number(Math.round(row.avg_construction))} {row.currency}</strong></div>) : <div className="dashboard-v2__value-row"><AppIcon name="money" /><strong>—</strong></div>}</div><small>на замовлення / на конструкцію</small></article>
      <article className="dashboard-v2__card dashboard-v2__card--accent"><span>Оборот</span><div className="dashboard-v2__money">{currencyRows.map(row => <div className="dashboard-v2__value-row" key={row.currency}><AppIcon name="money" /><strong>{money(row.total_sum, row.currency)}</strong></div>)}</div><small>сума замовлень за період</small></article>
    </section>
    <div className="dashboard-v2__details">
      <section className="dashboard-v2__execution">
        <div className="dashboard-v2__section-heading"><div><span className="dashboard-v2__kicker">ВИРОБНИЦТВО</span><h2>Виконання замовлень</h2></div><span className="dashboard-v2__total">{number(meta.orders_count)} всього</span></div>
        <div className="dashboard-v2__performance"><strong>{number(percent)}<span>%</span></strong><p>завершених замовлень<br />виготовлено вчасно</p></div>
        <div className="dashboard-v2__bar" role="img" aria-label={stages.map(stage => `${stage.name}: ${number(stage.count)}`).join(", ")}>
          {stageTotal > 0 ? stages.filter(stage => stage.count > 0).map(stage => <span key={stage.name} className={`is-${stage.color}`} style={{ width: `${stage.count / stageTotal * 100}%` }} />) : <span className="is-empty" style={{width:"100%"}} />}
        </div>
        <div className="dashboard-v2__stages">{stages.map(stage => <button type="button" className={`dashboard-v2__stage is-${stage.color}`} key={stage.name} onClick={() => onSelectStatus(stage.name)} title={`Відкрити деталізацію: ${stage.name}`}>
          <span><i />{stage.name}<b aria-hidden="true">↗</b></span><strong>{number(stage.count)}</strong><small>{stage.percent !== undefined ? `${number(stage.percent)}% · ` : ""}{stage.hint}</small>
        </button>)}</div>
      </section>
      <section className="dashboard-v2__timing"><span className="dashboard-v2__kicker">ТЕРМІНИ</span><h2>Вчасне виготовлення</h2>
        <div className="dashboard-v2__delay dashboard-v2__delay--success"><span>Середній термін вчасних замовлень</span><strong><AppIcon name="FactorySuccessGreenIcon" />{averageProductionDays == null ? "—" : number(averageProductionDays)}{averageProductionDays != null && <small>дн.</small>}</strong></div>
        <dl><div><dt>Середня затримка</dt><dd>{number(meta.avg_delay_days)} дн.</dd></div><div><dt>Максимальна затримка</dt><dd>{number(meta.max_delay_days)} дн.</dd></div></dl>
        <Link to="/statistics">Детальніше в аналітиці <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  </div>;
}
