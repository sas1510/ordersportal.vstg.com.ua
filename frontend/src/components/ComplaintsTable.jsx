import React, { useEffect, useRef } from "react";
import $ from "jquery";
import "datatables.net";
import getStatusClass from "./getStatusClass";

export default function ComplaintsTable({ data, onRowClick }) {
  const tableRef = useRef();

  useEffect(() => {
    if (data.length > 0) {
      $(tableRef.current).DataTable({
        pageLength: 10,
        lengthChange: false,
        responsive: true,
      });
    }
    return () => {
      if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy(true);
      }
    };
  }, [data]);

  return (
    <table ref={tableRef} className="display stripe hover min-w-full text-sm">
      <thead className="bg-gray-200">
        <tr>
          <th>№</th>
          <th>Номер</th>
          <th>Дата</th>
          <th>Коментар</th>
          <th>Контрагент</th>
          <th>Вирішення</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr
            key={idx}
            className={idx % 2 === 0 ? "bg-white cursor-pointer" : "bg-gray-50 cursor-pointer"}
            onClick={() => onRowClick(item)}
          >
            <td className="text-center">{item.WebNumber || "-"}</td>
            <td className="text-center">{item.OrderNumber}</td>
            <td className="text-center">{new Date(item.ComplaintDate).toLocaleDateString()}</td>
            <td>{item.DescriptionComplaint}</td>
            <td>{item.FullName}</td>
            <td>{item.IssueName || item.SolutionName}</td>
            <td className={getStatusClass(item.StatusName)}>{item.StatusName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
