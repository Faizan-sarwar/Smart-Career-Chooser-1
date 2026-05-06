// src/pages/admin/ManageMarket.jsx
//
// Full editor for the market trends snapshot. Pulls current data from
// /api/admin/market, lets admin edit, PUTs back. Pakistan-localized (PKR).

import React, { useState, useEffect } from "react";
import {
  Save,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import api from "../../lib/axios.js";
import s from "./ManageMarket.module.css";

const EMPTY = {
  stats: { openRoles: "", avgSalary: "", remoteShare: "", topGrowthField: "" },
  ticker: [],
  salaryYears: [],
  topSkills: [],
  trendingCareers: [],
};

export default function ManageMarket() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  const fetchMarket = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: payload } = await api.get("/admin/market");
      if (payload) {
        setData({
          stats: payload.stats || EMPTY.stats,
          ticker: payload.ticker || [],
          salaryYears: payload.salaryYears || [],
          topSkills: payload.topSkills || [],
          trendingCareers: payload.trendingCareers || [],
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load market data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/market", data);
      setSavedAt(new Date());
      setTimeout(() => setSavedAt(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Field updaters
  const updateStats = (k, v) =>
    setData((d) => ({ ...d, stats: { ...d.stats, [k]: v } }));
  const addTicker = () =>
    setData((d) => ({ ...d, ticker: [...d.ticker, "New ticker item"] }));
  const removeTicker = (i) =>
    setData((d) => ({ ...d, ticker: d.ticker.filter((_, idx) => idx !== i) }));
  const updateTicker = (i, v) =>
    setData((d) => ({
      ...d,
      ticker: d.ticker.map((t, idx) => (idx === i ? v : t)),
    }));

  const addSkill = () =>
    setData((d) => ({
      ...d,
      topSkills: [...d.topSkills, { skill: "New Skill", demand: 50 }],
    }));
  const removeSkill = (i) =>
    setData((d) => ({
      ...d,
      topSkills: d.topSkills.filter((_, idx) => idx !== i),
    }));
  const updateSkill = (i, k, v) =>
    setData((d) => ({
      ...d,
      topSkills: d.topSkills.map((s, idx) =>
        idx === i ? { ...s, [k]: k === "demand" ? Number(v) : v } : s
      ),
    }));

  const addTrending = () =>
    setData((d) => ({
      ...d,
      trendingCareers: [
        ...d.trendingCareers,
        { title: "New Career", growth: "+50%", color: "#0d9488" },
      ],
    }));
  const removeTrending = (i) =>
    setData((d) => ({
      ...d,
      trendingCareers: d.trendingCareers.filter((_, idx) => idx !== i),
    }));
  const updateTrending = (i, k, v) =>
    setData((d) => ({
      ...d,
      trendingCareers: d.trendingCareers.map((c, idx) =>
        idx === i ? { ...c, [k]: v } : c
      ),
    }));

  if (loading) {
    return (
      <Page>
        <PageHead title="Market Data Manager" />
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading market snapshot…</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHead title="Market Data Manager" />
        <div className={s.errorState}>
          <AlertCircle size={28} />
          <h3>Could not load market data</h3>
          <p>{error}</p>
          <Button onClick={fetchMarket}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Market Data Manager"
        subtitle="Edit the labor market snapshot students see — values in PKR (Pakistani Rupees)."
        actions={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {savedAt && (
              <span className={s.savedBadge}>
                <CheckCircle size={14} /> Saved
              </span>
            )}
            <Button onClick={save} disabled={saving}>
              <Save size={14} /> {saving ? "Saving…" : "Publish updates"}
            </Button>
          </div>
        }
      />

      {/* Headline stats */}
      <Card title="Headline indicators">
        <div className={s.formGrid}>
          <div className={s.inputGroup}>
            <label className={s.label}>Total open roles</label>
            <input
              className={s.input}
              value={data.stats.openRoles}
              onChange={(e) => updateStats("openRoles", e.target.value)}
              placeholder="e.g. 14.2K"
            />
          </div>
          <div className={s.inputGroup}>
            <label className={s.label}>Average salary (PKR)</label>
            <input
              className={s.input}
              value={data.stats.avgSalary}
              onChange={(e) => updateStats("avgSalary", e.target.value)}
              placeholder="e.g. PKR 2.4M"
            />
          </div>
          <div className={s.inputGroup}>
            <label className={s.label}>Remote work share</label>
            <input
              className={s.input}
              value={data.stats.remoteShare}
              onChange={(e) => updateStats("remoteShare", e.target.value)}
              placeholder="e.g. 38%"
            />
          </div>
          <div className={s.inputGroup}>
            <label className={s.label}>Top growth field</label>
            <input
              className={s.input}
              value={data.stats.topGrowthField}
              onChange={(e) => updateStats("topGrowthField", e.target.value)}
              placeholder="e.g. AI Engineering"
            />
          </div>
        </div>
      </Card>

      {/* Ticker */}
      <Card
        title="News ticker"
        action={
          <Button variant="secondary" size="sm" onClick={addTicker}>
            <Plus size={14} /> Add item
          </Button>
        }
      >
        <div className={s.list}>
          {data.ticker.length === 0 && (
            <div className={s.emptyMsg}>No ticker items. Add some above.</div>
          )}
          {data.ticker.map((t, i) => (
            <div key={i} className={s.row}>
              <input
                className={s.input}
                value={t}
                onChange={(e) => updateTicker(i, e.target.value)}
                placeholder="🇵🇰 Tech news headline…"
              />
              <button
                className={s.removeBtn}
                onClick={() => removeTicker(i)}
                aria-label="Remove ticker item"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Top skills */}
      <Card
        title="In-demand skills"
        action={
          <Button variant="secondary" size="sm" onClick={addSkill}>
            <Plus size={14} /> Add skill
          </Button>
        }
      >
        <div className={s.list}>
          {data.topSkills.length === 0 && (
            <div className={s.emptyMsg}>No skills set yet.</div>
          )}
          {data.topSkills.map((sk, i) => (
            <div key={i} className={s.row}>
              <input
                className={s.input}
                value={sk.skill}
                onChange={(e) => updateSkill(i, "skill", e.target.value)}
                placeholder="Skill name (e.g. Python)"
              />
              <input
                className={s.inputSmall}
                type="number"
                min="0"
                max="100"
                value={sk.demand}
                onChange={(e) => updateSkill(i, "demand", e.target.value)}
                placeholder="0-100"
              />
              <button
                className={s.removeBtn}
                onClick={() => removeSkill(i)}
                aria-label="Remove skill"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Trending careers */}
      <Card
        title="Trending careers"
        action={
          <Button variant="secondary" size="sm" onClick={addTrending}>
            <Plus size={14} /> Add career
          </Button>
        }
      >
        <div className={s.list}>
          {data.trendingCareers.length === 0 && (
            <div className={s.emptyMsg}>No trending careers set.</div>
          )}
          {data.trendingCareers.map((c, i) => (
            <div key={i} className={s.row}>
              <input
                className={s.input}
                value={c.title}
                onChange={(e) => updateTrending(i, "title", e.target.value)}
                placeholder="Career title"
              />
              <input
                className={s.inputSmall}
                value={c.growth}
                onChange={(e) => updateTrending(i, "growth", e.target.value)}
                placeholder="+74%"
              />
              <input
                className={s.colorInput}
                type="color"
                value={c.color}
                onChange={(e) => updateTrending(i, "color", e.target.value)}
                aria-label="Color"
              />
              <button
                className={s.removeBtn}
                onClick={() => removeTrending(i)}
                aria-label="Remove career"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}