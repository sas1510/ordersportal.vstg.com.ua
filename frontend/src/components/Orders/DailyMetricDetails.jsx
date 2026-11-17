export default function DailyMetricDetails({ model }) {
  return <>
    <p className="daily-metric-explanation">{model.explanation}<br />{model.summary}</p>
    <div className="reconcile-scroll"><table>
      <thead><tr>{model.columns.map(column=><th key={column.key} className={column.highlight ? "daily-counted-column" : undefined}>{column.label}</th>)}</tr></thead>
      <tbody>{model.rows.map(row=><tr key={row.id}>{model.columns.map(column=>{
        const cell=row[column.key];
        return <td key={column.key} className={cell?.counted ? "daily-counted-value" : undefined}><span title={cell?.hint || undefined}>{cell?.value ?? "—"}</span></td>;
      })}</tr>)}</tbody>
    </table></div>
  </>;
}
