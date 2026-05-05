import React, { createContext, useContext, useEffect, useState } from "react";

const AssessmentContext = createContext(null);
const KEY = "cc.assessment";

const initial = { step: 0, answers: {}, completed: false };

export function AssessmentProvider({ children }) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return initial;
    try { return JSON.parse(localStorage.getItem(KEY)) || initial; } catch { return initial; }
  });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state)); }, [state]);

  const setAnswer = (key, value) =>
    setState((s) => ({ ...s, answers: { ...s.answers, [key]: value } }));
  const next = () => setState((s) => ({ ...s, step: s.step + 1 }));
  const back = () => setState((s) => ({ ...s, step: Math.max(0, s.step - 1) }));
  const complete = () => setState((s) => ({ ...s, completed: true }));
  const reset = () => setState(initial);

  return (
    <AssessmentContext.Provider value={{ ...state, setAnswer, next, back, complete, reset }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export const useAssessment = () => useContext(AssessmentContext);
