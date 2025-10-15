import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import "./ChartSection.css";

const DOMAIN = process.env.REACT_APP_API_URL;

interface TrendData {
  date: string;
  newUsers: number;
  newPosts: number;
}

export default function ChartSection() {
  const [data, setData] = useState<TrendData[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    axios.get(`${DOMAIN}/api/v1/admin/dashboard/trend`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.data.code === "SU") setData(res.data.trendList);
        else console.error(res.data.message);
      })
      .catch((err) => console.error("Trend data load error:", err));
  }, []);

  return (
    <div className="chart-section">
      <h3 className="chart-title">📈 주간 가입자 및 게시글 추이</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 50, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="newUsers" stroke="#7b16f0" strokeWidth={2} name="가입자 수" />
          <Line type="monotone" dataKey="newPosts" stroke="#ff7e67" strokeWidth={2} name="게시글 수" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
