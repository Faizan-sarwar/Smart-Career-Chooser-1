import React, { useMemo, useState, useEffect } from "react";
import { ArrowUpDown, Ban, CheckCircle, Trash2 } from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import { Select } from "../../components/common/Field.jsx";
import CircularProgress from "../../components/common/CircularProgress.jsx";
import api from "../../lib/axios.js";
import s from "./UserManagement.module.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState({ key: "joined", dir: "desc" });
  const [confirm, setConfirm] = useState(null);

  // 1. Fetch Real Users on Load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/admin/users');
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // 2. Real Database Status Toggle
  const toggleStatus = async (id) => {
    try {
      await api.put(`/admin/users/${id}/status`);
      setUsers((us) => us.map((u) => u.id === id ? { ...u, status: u.status === "active" ? "disabled" : "active" } : u));
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating user status.");
    }
  };

  // 3. Real Database Deletion
  const remove = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((us) => us.filter((u) => u.id !== id));
      setConfirm(null);
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Error deleting user.");
    }
  };

  const filtered = useMemo(() => {
    let r = users.filter((u) =>
      (role === "All" || u.role.toLowerCase() === role.toLowerCase()) &&
      (status === "All" || u.status === status) &&
      (u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
    );
    r = [...r].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [users, q, role, status, sort]);

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  const head = (label, key) => (
    <th onClick={() => toggleSort(key)} style={{ cursor: 'pointer' }}>
      <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
        {label} <ArrowUpDown size={12} />
      </span>
    </th>
  );

  if (isLoading) return <Page><div style={{display:'grid', placeItems:'center', height:'50vh'}}><CircularProgress value={0} size={50} stroke={4}/></div></Page>;

  return (
    <Page>
      <PageHead
        title="User Management"
        subtitle={`${filtered.length} of ${users.length} users`}
        action={<Button>Invite user</Button>}
      />

      <Card>
        <div className={s.toolbar}>
          <input className={s.search} placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option>All</option><option value="student">Student</option><option value="mentor">Mentor</option><option value="admin">Admin</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option><option value="active">Active</option><option value="disabled">Disabled</option>
          </Select>
        </div>

        <div className={s.tableWrap} style={{ marginTop: 16 }}>
          <table className={s.table}>
            <thead>
              <tr>
                {head("User", "name")}
                {head("Email", "email")}
                {head("Role", "role")}
                {head("Status", "status")}
                {head("Joined", "joined")}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className={s.name}>
                      <div className={s.avatar}>{u.name.split(" ").map((x) => x[0]).join("").toUpperCase()}</div>
                      {u.name}
                    </div>
                  </td>
                  <td style={{ color: "var(--color-muted)" }}>{u.email}</td>
                  <td><Badge tone={u.role.toLowerCase() === "admin" ? "info" : u.role.toLowerCase() === "mentor" ? "primary" : "neutral"}>{u.role}</Badge></td>
                  <td><Badge tone={u.status === "active" ? "primary" : "danger"}>{u.status}</Badge></td>
                  <td style={{ color: "var(--color-muted)" }}>{u.joined}</td>
                  <td>
                    <div className={s.actions}>
                      <button className={s.iconBtn} onClick={() => toggleStatus(u.id)}>
                        {u.status === "active" ? <><Ban size={12} /> Disable</> : <><CheckCircle size={12} /> Enable</>}
                      </button>
                      <button className={`${s.iconBtn} ${s.iconBtnDanger}`} onClick={() => setConfirm(u)}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--color-muted)" }}>No users found in database.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {confirm && (
        <div className={s.scrim} onClick={() => setConfirm(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete {confirm.name}?</h3>
            <p>This action can't be undone. The user will be permanently erased from MongoDB.</p>
            <div className={s.modalActions}>
              <Button variant="secondary" onClick={() => setConfirm(null)} disabled={isLoading}>Cancel</Button>
              <Button variant="danger" onClick={() => remove(confirm.id)} disabled={isLoading}>Delete user</Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}