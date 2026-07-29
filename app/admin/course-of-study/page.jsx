"use client";

import { useEffect, useMemo, useState } from "react";
import { CAMPUSES } from "../../../lib/campuses";

const ADMIN_PASSWORD_STORAGE = "courseOfStudyAdminPassword";

export default function CourseOfStudyAdminPage() {
  const [password, setPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [store, setStore] = useState({});
  const [selectedProgram, setSelectedProgram] = useState("");
  const [draftText, setDraftText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const programsByCampus = useMemo(() => CAMPUSES, []);

  useEffect(() => {
    const savedPassword = sessionStorage.getItem(ADMIN_PASSWORD_STORAGE) || "";
    if (savedPassword) {
      setPassword(savedPassword);
      setPasswordInput(savedPassword);
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;

    async function loadStore() {
      setLoading(true);
      setStatus("");
      try {
        const res = await fetch("/api/course-of-study");
        if (!res.ok) throw new Error("Could not load Course of Study data");
        const data = await res.json();
        if (!cancelled) setStore(data);
      } catch (err) {
        if (!cancelled) setStatus(err.message || "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStore();
    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  useEffect(() => {
    if (!selectedProgram) {
      setDraftText("");
      return;
    }
    setDraftText(store[selectedProgram]?.text || "");
  }, [selectedProgram, store]);

  async function signIn() {
    const trimmed = passwordInput.trim();
    if (!trimmed) return;

    setLoggingIn(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Incorrect password");
      }

      sessionStorage.setItem(ADMIN_PASSWORD_STORAGE, trimmed);
      setPassword(trimmed);
      setAuthenticated(true);
      setStatus("Signed in.");
    } catch (err) {
      setAuthenticated(false);
      setStatus(err.message || "Sign in failed");
    } finally {
      setLoggingIn(false);
    }
  }

  function signOut() {
    sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE);
    setPassword("");
    setPasswordInput("");
    setAuthenticated(false);
    setSelectedProgram("");
    setDraftText("");
    setStore({});
    setStatus("Signed out.");
  }

  async function saveProgram() {
    if (!selectedProgram) return;
    if (!password) {
      setStatus("Sign in before saving.");
      return;
    }

    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/course-of-study", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program: selectedProgram,
          text: draftText,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Save failed");
      }

      setStore((prev) => ({
        ...prev,
        [selectedProgram]: { text: data.text, updatedAt: data.updatedAt },
      }));
      setStatus(`Saved Course of Study for ${selectedProgram}.`);
    } catch (err) {
      setStatus(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const selectedMeta = selectedProgram ? store[selectedProgram] : null;

  if (!authenticated) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <header style={styles.header}>
            <h1 style={styles.title}>Course of Study Admin</h1>
            <p style={styles.subtitle}>
              Sign in with the staff admin password to manage Course of Study
              content for each program.
            </p>
          </header>

          <section style={{ ...styles.card, maxWidth: "480px" }}>
            <h2 style={styles.cardTitle}>Staff Sign In</h2>
            <p style={styles.helpText}>
              Use the shared admin password provided by your department.
            </p>
            <div style={styles.row}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signIn()}
                placeholder="Admin password"
                style={styles.input}
              />
              <button
                type="button"
                onClick={signIn}
                disabled={loggingIn}
                style={styles.primaryBtn}
              >
                {loggingIn ? "Signing in…" : "Sign In"}
              </button>
            </div>
            {status ? <p style={styles.status}>{status}</p> : null}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.title}>Course of Study Admin</h1>
              <p style={styles.subtitle}>
                Manage the Course of Study paragraph for each program. Students
                no longer edit this in the resume builder — it is pulled
                automatically when they download their resume.
              </p>
            </div>
            <button type="button" onClick={signOut} style={styles.secondaryBtn}>
              Sign Out
            </button>
          </div>
        </header>

        <div style={styles.layout}>
          <aside style={styles.sidebar}>
            <h2 style={styles.cardTitle}>Programs by Campus</h2>
            {loading ? (
              <p style={styles.helpText}>Loading programs…</p>
            ) : (
              Object.entries(programsByCampus).map(([campus, programs]) => (
                <div key={campus} style={styles.campusBlock}>
                  <div style={styles.campusLabel}>{campus}</div>
                  {programs.map((program) => {
                    const hasText = !!store[program]?.text?.trim();
                    const active = selectedProgram === program;
                    return (
                      <button
                        key={program}
                        type="button"
                        onClick={() => setSelectedProgram(program)}
                        style={{
                          ...styles.programBtn,
                          ...(active ? styles.programBtnActive : {}),
                        }}
                      >
                        <span>{program}</span>
                        <span style={hasText ? styles.badgeDone : styles.badgeEmpty}>
                          {hasText ? "Set" : "Empty"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </aside>

          <main style={styles.editorCard}>
            {!selectedProgram ? (
              <p style={styles.helpText}>Select a program to edit its Course of Study.</p>
            ) : (
              <>
                <div style={styles.editorHeader}>
                  <div>
                    <h2 style={styles.cardTitle}>{selectedProgram}</h2>
                    {selectedMeta?.updatedAt ? (
                      <p style={styles.helpText}>
                        Last updated {new Date(selectedMeta.updatedAt).toLocaleString()}
                      </p>
                    ) : (
                      <p style={styles.helpText}>No content saved yet.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={saveProgram}
                    disabled={saving}
                    style={styles.primaryBtn}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  rows={14}
                  placeholder="Write the Course of Study paragraph that should appear on resumes for this program…"
                  style={styles.textarea}
                />
                <p style={styles.helpText}>
                  This text is added to every resume for students in this program.
                </p>
              </>
            )}
            {status ? <p style={styles.status}>{status}</p> : null}
          </main>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "32px 20px",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
    color: "#0f172a",
  },
  shell: { maxWidth: "1180px", margin: "0 auto" },
  header: { marginBottom: "24px" },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },
  title: { margin: 0, fontSize: "28px" },
  subtitle: { margin: "8px 0 0", color: "#475569", lineHeight: 1.6 },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "20px",
    alignItems: "start",
  },
  sidebar: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    maxHeight: "72vh",
    overflowY: "auto",
  },
  editorCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    minHeight: "420px",
  },
  cardTitle: { margin: "0 0 8px", fontSize: "18px" },
  helpText: { margin: "0 0 12px", color: "#64748b", fontSize: "14px", lineHeight: 1.5 },
  row: { display: "flex", gap: "10px", flexWrap: "wrap" },
  input: {
    flex: "1 1 240px",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    lineHeight: 1.6,
    resize: "vertical",
    minHeight: "280px",
  },
  primaryBtn: {
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "#e2e8f0",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  campusBlock: { marginBottom: "18px" },
  campusLabel: {
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#64748b",
    marginBottom: "8px",
  },
  programBtn: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    textAlign: "left",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  programBtnActive: {
    background: "#eff6ff",
    borderColor: "#93c5fd",
  },
  badgeDone: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#15803d",
    background: "#dcfce7",
    padding: "2px 8px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
  },
  badgeEmpty: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#b45309",
    background: "#fef3c7",
    padding: "2px 8px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
  },
  editorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "16px",
  },
  status: {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "8px",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontSize: "14px",
  },
};
