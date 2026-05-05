import React, { useState, useEffect } from "react";
import { Check, Lock, X, BookOpen, Clock } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Button from "../../components/common/Button.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import api from "../../lib/axios.js";
import s from "./SkillRoadmap.module.css";

export default function SkillRoadmap() {
  const [open, setOpen] = useState(null);
  const [roadmap, setRoadmap] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const { data } = await api.get('/roadmap');
        setRoadmap(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  if (isLoading) return <Page><div style={{display:'grid', placeItems:'center', height:'50vh'}}><CircularProgress value={0} size={50} stroke={4}/></div></Page>;

  const completed = roadmap.filter((n) => n.done).length;
  const pct = roadmap.length > 0 ? Math.round((completed / roadmap.length) * 100) : 0;

  return (
    <Page>
      <PageHead title="Skill Roadmap" subtitle="Bridge the gap between where you are and where you're going." />
      {/* ... KEEP ALL YOUR EXISTING JSX EXACTLY THE SAME FROM HERE DOWN ... */}
      
      <div className={s.summary}>
        <div>
          <div className={s.sumLabel}>Roadmap progress</div>
          <div className={s.sumValue}>{completed} / {roadmap.length} milestones</div>
        </div>
        <div className={s.bar}>
          <div className={s.barFill} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={s.timeline}>
        {roadmap.map((node, i) => (
          <div
            key={node.id}
            className={`${s.node} ${node.done ? s.nodeDone : s.nodeLocked}`}
            style={{ animationDelay: `${i * 0.08}s` }}
            onClick={() => !node.done && setOpen(node)}
          >
            <div className={s.bullet}>
              {node.done ? <Check size={18} /> : <Lock size={16} />}
            </div>
            <div className={s.nodeBody}>
              <div className={s.nodeTitle}>{node.name}</div>
              <div className={s.nodeMeta}>
                {node.done ? "Completed" : `${node.courses.length} suggested course${node.courses.length === 1 ? "" : "s"}`}
              </div>
            </div>
            {!node.done && <Button variant="ghost" size="sm">View →</Button>}
          </div>
        ))}
      </div>

      {open && (
        <div className={s.scrim} onClick={() => setOpen(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button className={s.close} onClick={() => setOpen(null)} aria-label="Close"><X size={18} /></button>
            <div className={s.modalHead}>
              <Lock size={18} />
              <h2>{open.name}</h2>
            </div>
            <p className={s.modalSub}>Recommended courses to unlock this skill.</p>
            <div className={s.courseList}>
              {open.courses.map((c, i) => (
                <div key={i} className={s.course}>
                  <BookOpen size={18} />
                  <div style={{ flex: 1 }}>
                    <div className={s.courseTitle}>{c.title}</div>
                    <div className={s.courseMeta}>{c.provider} · <Clock size={11} /> {c.hours}h</div>
                  </div>
                  <Button size="sm">Enroll</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}