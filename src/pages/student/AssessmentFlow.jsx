import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import Button from "../../components/common/Button.jsx";
import { useAssessment } from "../../context/AssessmentContext.jsx";
import api from "../../lib/axios.js"; // Backend connection
import s from "./AssessmentFlow.module.css";

const STEPS = [
  { key: "interest", title: "What energizes you most?", sub: "Pick the area you most enjoy spending time on.",
    options: ["Building things with technology", "Helping and teaching people", "Designing and visual creativity", "Analyzing data and patterns", "Leading projects and people"] },
  { key: "personality", title: "Which best describes you at work?", sub: "Choose the option that fits you most.",
    options: ["Analytical and detail-oriented", "Empathetic and collaborative", "Creative and visionary", "Pragmatic and decisive", "Curious and exploratory"] },
  { key: "skill", title: "What's your strongest skill area?", sub: "Where do you naturally outperform peers?",
    options: ["Programming / technical", "Communication / writing", "Visual design / aesthetics", "Math / logic", "Leadership / organization"] },
  { key: "style", title: "Your ideal work style?", sub: "How do you prefer to spend your days?",
    options: ["Deep solo focus work", "Pair / small-team collaboration", "Cross-functional meetings", "Field / on-the-ground work", "Mix of remote and in-person"] },
  { key: "goal", title: "What's your top 3-year goal?", sub: "Where do you want to be?",
    options: ["Land a high-impact technical role", "Become a recognized expert in a niche", "Start my own venture", "Lead a team", "Make a measurable social impact"] },
];

export default function AssessmentFlow() {
  const { step, answers, setAnswer, next, back, complete, completed, reset } = useAssessment();
  const navigate = useNavigate();
  
  // Enterprise State Management for API Calls
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // The function that securely saves the assessment to the database
  const finishAssessment = async () => {
    setIsSubmitting(true);
    setError("");
    
    try {
      // POST the answers payload to our backend
      await api.post('/assessment', { answers });
      
      // Update global context to mark as completed
      complete(); 
      
    } catch (err) {
      console.error("Failed to submit assessment:", err);
      setError(err.response?.data?.message || "Failed to save results. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // View: Success State (After finishing the API call)
  if (completed || step >= STEPS.length) {
    return (
      <Page>
        <div className={s.card}>
          <div className={s.celebrate}>
            <CheckCircle2 size={56} color="#52a447" />
            <h2>Assessment complete!</h2>
            <p>We've matched you with the careers that fit you best.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Button onClick={() => navigate("/student/recommendations")}>See recommendations</Button>
              <Button variant="secondary" onClick={reset}>Retake</Button>
            </div>
          </div>

          <div className={s.summary}>
            {STEPS.map((q) => (
              <div key={q.key} className={s.summaryRow}>
                <span className={s.summaryLabel}>{q.title}</span>
                <span className={s.summaryValue}>{answers[q.key] || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </Page>
    );
  }

  // View: Active Quiz State
  const current = STEPS[step];
  const value = answers[current.key];
  const pct = Math.round((step / STEPS.length) * 100);

  return (
    <Page>
      <PageHead title="Career Assessment" subtitle="Multi-step evaluation of your interests, personality and skills." />
      <div className={s.card}>
        <div className={s.head}>
          <div className={s.title}>Step {step + 1} of {STEPS.length}</div>
          <div className={s.step}>{pct}% complete</div>
        </div>
        <div style={{ marginTop: 8, marginBottom: 24 }}>
          <ProgressBar value={pct} showValue={false} />
        </div>

        <h3 className={s.qTitle}>{current.title}</h3>
        <p className={s.qSub}>{current.sub}</p>

        <div key={`q-${step}`} className={s.options}>
          {current.options.map((opt, i) => (
            <button
              key={opt}
              className={`${s.option} ${value === opt ? s.optionActive : ""}`}
              onClick={() => setAnswer(current.key, opt)}
              type="button"
              style={{ animationDelay: `${i * 60}ms` }}
              disabled={isSubmitting} // Lock options while saving
            >
              <span className={s.radio}>{value === opt && <span className={s.radioDot} />}</span>
              {opt}
            </button>
          ))}
        </div>

        {/* Display Error Warning if Backend Fails */}
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className={s.actions}>
          <Button variant="secondary" onClick={back} disabled={step === 0 || isSubmitting}>Back</Button>
          
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!value || isSubmitting}>Next</Button>
          ) : (
            <Button onClick={finishAssessment} disabled={!value || isSubmitting}>
              {isSubmitting ? "Saving..." : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </Page>
  );
}