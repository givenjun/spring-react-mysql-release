import React from "react";

interface Props {
  title: string;
  value: number | string;
}

export default function SummaryCard({ title, value }: Props) {
  return (
    <div className="summary-card">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}
