import React, { useState } from "react";
import { Plus, Map, Trash2 } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import s from "./ManageRoadmaps.module.css";

export default function ManageRoadmaps() {
  const [roadmaps, setRoadmaps] = useState([
    { id: 1, name: "Programming Fundamentals", courses: 3, status: "Active" },
    { id: 2, name: "Frontend Development (React)", courses: 5, status: "Active" }
  ]);

  return (
    <Page>
      <PageHead title="Roadmap Builder" subtitle="Design learning paths and milestone requirements." action={<Button><Plus size={16} /> Create Path</Button>} />
      
      <Card title="Active Learning Paths">
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Path Name</th><th>Courses Linked</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {roadmaps.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight: 600}}><Map size={14} style={{marginRight: 8, display:'inline'}}/>{r.name}</td>
                  <td>{r.courses} modules</td>
                  <td><Badge tone="primary">{r.status}</Badge></td>
                  <td>
                    <div className={s.actions}>
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" style={{color: 'var(--color-danger)'}}><Trash2 size={16}/></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  );
}