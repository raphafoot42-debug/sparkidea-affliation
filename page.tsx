"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedGrid } from "@/components/AnimatedGrid";
import type { SchemaResult } from "@/lib/ai/schema-generator";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (idea.trim().length < 6) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      // On garde le résultat en mémoire de session le temps que l'utilisateur
      // s'inscrive et paye — rien n'est en base tant que ce n'est pas payé.
      sessionStorage.setItem(
        "spark_pending_schema",
        JSON.stringify({ schema: data.schema as SchemaResult, rawInput: idea, name })
      );
      router.push("/result");
    } catch {
      setError("Impossible de contacter le serveur. Réessaie.");
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <AnimatedGrid intensity="intense" />

      <div
        style={{
          position: "fixed",
          top: 20,
          left: 24,
          right: 24,
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>◆ Spark Idea</div>
        <a href="/login" className="btn-secondary" style={{ borderRadius: 20 }}>
          Connexion
        </a>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "10vh 24px 6vh",
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: 22,
          }}
        >
          Spark Idea
        </div>

        <h1
          style={{
            fontSize: "clamp(30px, 5vw, 52px)",
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 760,
          }}
        >
          Ton idée,{" "}
          <span
            style={{
              background: "linear-gradient(90deg, var(--line), var(--line2))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            ta destinée.
          </span>
        </h1>

        <p
          style={{
            marginTop: 18,
            fontSize: 15.5,
            color: "var(--muted)",
            textAlign: "center",
            maxWidth: 500,
            lineHeight: 1.6,
          }}
        >
          Décris ton idée de projet, obtiens en quelques secondes un plan
          précis pour la lancer — gratuit, sans inscription.
        </p>

        <div style={{ display: "flex", gap: 26, marginTop: 34, flexWrap: "wrap", justifyContent: "center" }}>
          {["Décris ton idée", "Reçois ton plan", "Passe à l'action"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--muted)" }}>
              <span
                style={{
                  width: 19,
                  height: 19,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10.5,
                  color: "var(--text)",
                }}
              >
                {i + 1}
              </span>
              {s}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 42, fontSize: 13, color: "var(--muted)" }}>
          C&apos;est comment ton prénom ?
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="Prénom"
            style={{
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.2)",
              color: "var(--text)",
              fontSize: 13,
              padding: "4px 2px",
              width: 120,
              outline: "none",
              textAlign: "center",
            }}
          />
        </div>

        <div style={{ marginTop: 24, width: "100%", maxWidth: 600 }}>
          <div
            className="panel"
            style={{ padding: 4, borderRadius: 16, position: "relative" }}
          >
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Ex : une appli qui aide les artisans à faire leurs devis en 2 minutes..."
              rows={2}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                color: "var(--text)",
                fontSize: 14.5,
                lineHeight: 1.5,
                padding: "15px 110px 15px 16px",
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={idea.trim().length < 6 || loading}
              className="btn-primary"
              style={{ position: "absolute", right: 8, bottom: 8 }}
            >
              {loading ? "Analyse..." : "Analyser →"}
            </button>
          </div>
          {error && <div className="error-text" style={{ textAlign: "center" }}>{error}</div>}
          <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--muted)", marginTop: 12 }}>
            Aucune carte bancaire nécessaire pour voir ton plan
          </div>
        </div>
      </div>

      <Link
        href="/admin/login"
        style={{
          position: "fixed",
          bottom: 18,
          right: 22,
          zIndex: 10,
          fontSize: 11,
          color: "rgba(255,255,255,0.28)",
          textDecoration: "none",
          padding: "4px 8px",
        }}
      >
        admin
      </Link>
    </div>
  );
}
