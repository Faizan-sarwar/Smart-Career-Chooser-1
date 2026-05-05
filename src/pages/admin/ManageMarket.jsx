import React, { useState } from "react";
import { Save, TrendingUp } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./ManageMarket.module.css";

export default function ManageMarket() {
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    openRoles: "48,210", avgSalary: "$118k", remoteShare: "41%", topGrowthField: "AI"
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real flow, this sends the updated stats to MongoDB
      // await api.put('/admin/market-data', stats);
      setTimeout(() => {
        alert("Market data live-updated for all students!");
        setIsSaving(false);
      }, 800);
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };

  return (
    <Page>
      <PageHead title="Market Data Manager" subtitle="Update the global labor market statistics." />
      <div className={s.layout}>
        <Card title="Global Indicators" action={<Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Publish Updates"} <Save size={16}/></Button>}>
          <div className={s.formGrid}>
            <div className={s.inputGroup}>
              <label className={s.label}>Total Open Roles</label>
              <input className={s.input} value={stats.openRoles} onChange={e => setStats({...stats, openRoles: e.target.value})} />
            </div>
            <div className={s.inputGroup}>
              <label className={s.label}>Average Salary</label>
              <input className={s.input} value={stats.avgSalary} onChange={e => setStats({...stats, avgSalary: e.target.value})} />
            </div>
            <div className={s.inputGroup}>
              <label className={s.label}>Remote Work Share</label>
              <input className={s.input} value={stats.remoteShare} onChange={e => setStats({...stats, remoteShare: e.target.value})} />
            </div>
            <div className={s.inputGroup}>
              <label className={s.label}>Top Growth Field</label>
              <input className={s.input} value={stats.topGrowthField} onChange={e => setStats({...stats, topGrowthField: e.target.value})} />
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}