export default function ComplaintDetails({ complaint }) {
  return (
    <div className="complaint-details">
      <p><b>Відповідальний:</b> {complaint.FullName}</p>
      <p><b>Дата рішення:</b> {complaint.OrderDefineDate || "—"}</p>
      <p><b>ID:</b> {complaint.id}</p>
      <p><b>Web номер:</b> {complaint.WebNumber}</p>
    </div>
  );
}
