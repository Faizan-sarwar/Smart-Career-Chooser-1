// src/pages/student/Recommendations.jsx
//
// Displays LLM-generated career recommendations with personalized reasoning,
// strengths, and gaps. Lets the user pick one to generate a roadmap for.

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Sparkles, RefreshCw, TrendingUp, AlertCircle, Target, ChevronDown } from "lucide-react";
import { Page, PageHead, TwoCol } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import api from "../../lib/axios.js";
import s from "./Recommendations.module.css";

const RIASEC_LABELS = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

export default function Recommendations() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [generatingRoadmapFor, setGeneratingRoadmapFor] = useState(null);

  const fetchRecs = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const { data } = await api.get(
        `/assessment/recommendations${refresh ? "?refresh=true" : ""}`
      );
      setData(data);
      if (data.careers?.length && !expandedId) setExpandedId(data.careers[0].id);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not load recommendations. Have you completed the assessment?"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecs(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateRoadmap = async (careerId) => {
    setGeneratingRoadmapFor(careerId);
    try {
      await api.post("/roadmap/generate", { careerId });
      navigate("/student/roadmap");
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not generate roadmap. Try again."
      );
    } finally {
      setGeneratingRoadmapFor(null);
    }
  };

  if (loading) {
    return (
      <Page>
        <div className={s.loadingBox}>
          <CircularProgress value={0} size={50} stroke={4} />
          <p>Loading your recommendations…</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#dc2626" }}>
            <AlertCircle size={20} /> {error}
          </div>
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => navigate("/student/assessment")}>
              Take the assessment
            </Button>
          </div>
        </Card>
      </Page>
    );
  }

  if (!data?.careers?.length) {
    return (
      <Page>
        <Card>
          <p>No recommendations yet. Complete the assessment first.</p>
          <Button onClick={() => navigate("/student/assessment")}>Start assessment</Button>
        </Card>
      </Page>
    );
  }

  const radarData = Object.entries(data.riasecScores || {}).map(([k, v]) => ({
    trait: RIASEC_LABELS[k] || k,
    score: v,
  }));

  return (
    <Page>
      <PageHead
        title="Your career recommendations"
        subtitle={
          <span>
            Holland Code:{" "}
            <strong style={{ color: "#16a34a", letterSpacing: 1.5 }}>
              {data.hollandCode}
            </strong>
            <span style={{ marginLeft: 12, color: "#6b7280" }}>
              · Generated {timeAgo(data.generatedAt)}
            </span>
          </span>
        }
        actions={
          <Button variant="secondary" onClick={() => fetchRecs(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? s.spin : ""} />
            {refreshing ? "Regenerating…" : "Regenerate"}
          </Button>
        }
      />

      <div className={s.aiNotice}>
        <Sparkles size={16} />
        <span>
          Personalized by AI based on your assessment. Match scores combine a rule-based
          fit algorithm (cosine similarity) with LLM judgment on Pakistan's job market.
        </span>
      </div>

      <div className={s.matches}>
        {data.careers.map((c) => (
          <article key={c.id} className={s.match}>
            <button
              className={s.matchHead}
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              aria-expanded={expandedId === c.id}
            >
              <div className={s.matchHeadLeft}>
                <div className={s.matchTitle}>{c.title}</div>
                {c.cluster && <Badge tone="default">{c.cluster}</Badge>}
              </div>
              <div className={s.matchHeadRight}>
                <span className={s.pct}>{c.match}%</span>
                <ChevronDown
                  size={20}
                  className={`${s.chev} ${expandedId === c.id ? s.chevOpen : ""}`}
                />
              </div>
            </button>

            <div className={s.meta}>
              {c.salary && <span>💰 {c.salary}</span>}
              {c.demand && <span>📊 {c.demand} demand</span>}
              {c.growth && (
                <span>
                  <TrendingUp size={12} /> {c.growth}
                </span>
              )}
            </div>

            {expandedId === c.id && (
              <div className={s.expanded}>
                {c.reasoning && (
                  <div className={s.reasoningBox}>
                    <div className={s.sectionLabel}>
                      <Sparkles size={14} /> Why this matches you
                    </div>
                    <p>{c.reasoning}</p>
                  </div>
                )}

                {c.strengthsMatch?.length > 0 && (
                  <div>
                    <div className={s.sectionLabel}>Your strengths for this role</div>
                    <ul className={s.bullets}>
                      {c.strengthsMatch.map((str, i) => (
                        <li key={i}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.gapsToAddress?.length > 0 && (
                  <div>
                    <div className={s.sectionLabel}>Gaps to address</div>
                    <ul className={s.bullets}>
                      {c.gapsToAddress.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.skills?.length > 0 && (
                  <div>
                    <div className={s.sectionLabel}>Core skills required</div>
                    <div className={s.skills}>
                      {c.skills.map((sk) => (
                        <span key={sk} className={s.tag}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {c.educationPaths?.length > 0 && (
                  <div>
                    <div className={s.sectionLabel}>Education paths in Pakistan</div>
                    <ul className={s.bullets}>
                      {c.educationPaths.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={s.expandedActions}>
                  <Button
                    onClick={() => handleGenerateRoadmap(c.id)}
                    disabled={generatingRoadmapFor === c.id}
                  >
                    <Target size={14} />
                    {generatingRoadmapFor === c.id
                      ? "Building roadmap…"
                      : "Generate skill roadmap"}
                  </Button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      <TwoCol>
        <Card title="Your RIASEC profile">
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="trait" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="You"
                  dataKey="score"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={0.4}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Your skill self-assessment">
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart
                data={data.skillStrength}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </TwoCol>
    </Page>
  );
}

function timeAgo(iso) {
  if (!iso) return "just now";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}