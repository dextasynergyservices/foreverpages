/* eslint-disable @next/next/no-img-element */
import React from "react";

type SampleTemplateProps = {
  name?: string;
  description?: string;
  biography?: string;
  preview?: string;
};

export default function MemorialTemplate(props: SampleTemplateProps) {
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}>
      <header style={{ padding: 24, borderBottom: "1px solid #e5e7eb" }}>
        <h1 style={{ margin: 0 }}>{props.name || "Sample Memorial"}</h1>
        <p style={{ margin: 0, color: "#6b7280" }}>{props.description || "A sample template."}</p>
      </header>

      <main style={{ padding: 24 }}>
        <section>
          <h2>Biography</h2>
          <p>{props.biography || "This is a sample biography for testing."}</p>
        </section>

        <section>
          <h2>Gallery</h2>
          <div style={{ display: "flex", gap: 12 }}>
            <img src={props.preview || "preview.png"} alt="preview" style={{ width: 200 }} />
          </div>
        </section>
      </main>
    </div>
  );
}

// Also provide a named export for compatibility with different import patterns
export { MemorialTemplate };
