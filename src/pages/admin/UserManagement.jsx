// src/pages/admin/UserManagement.jsx
//
// Real CRUD against /api/admin/users.
// Filters, sort, search are client-side (fast for typical FYP-scale data).

import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowUpDown,
  Ban,
  CheckCircle,
  Trash2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Page, PageHead } from "../../components/common/Page.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import { Select } from "../../components/common/Field.jsx";
import api from "../../lib/axios.js";
import s from "./UserManagement.module.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState({ key: "joined", dir: "desc" });
  const [confirm, setConfirm] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load users from database."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (id) => {
    setBusyId(id);
    try {
      const { data } = await api.put(`/admin/users/${id}/status`);
      setUsers((us) =>
        us.map((u) => (u.id === id ? { ...u, status: data.status } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user status");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    setBusyId(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((us) => us.filter((u) => u.id !== id));
      setConfirm(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    let r = users.filter(
      (u) =>
        (role === "All" || u.role.toLowerCase() === role.toLowerCase()) &&
        (status === "All" || u.status === status) &&
        (u.name.toLowerCase().includes(q.toLowerCase()) ||
          u.email.toLowerCase().includes(q.toLowerCase()))
    );
    r = [...r].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [users, q, role, status, sort]);

  const toggleSort = (key) =>
    setSort((s) => ({
      key,
      dir: s.key === key && s.dir === "asc" ? "desc" : "asc",
    }));

  const head = (label, key) => (
    <th onClick={() => toggleSort(key)} style={{ cursor: "pointer" }}>
      <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
        {label} <ArrowUpDown size={12} />
      </span>
    </th>
  );

  if (loading) {
    return (
      <Page>
        <PageHead title="User Management" />
        <div className={s.loadingState}>
          <div className={s.loaderRing} />
          <p>Loading users from MongoDB…</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHead title="User Management" />
        <div className={s.errorState}>
          <AlertCircle size={32} />
          <h3>Could not load users</h3>
          <p>{error}</p>
          <Button onClick={fetchUsers}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="User Management"
        subtitle={`${filtered.length} of ${users.length} users · Live from database`}
        actions={
          <Button variant="secondary" onClick={fetchUsers}>
            <RefreshCw size={14} /> Refresh
          </Button>
        }
      />

      <Card>
        <div className={s.toolbar}>
          <input
            className={s.search}
            placeholder="Search by name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option>All</option>
            <option value="Student">Student</option>
            <option value="Mentor">Mentor</option>
            <option value="Admin">Admin</option>
            <option value="President">President</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
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
                      <div className={s.avatar}>
                        {u.name
                          .split(" ")
                          .map((x) => x[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className={s.muted}>{u.email}</td>
                  <td>
                    <Badge
                      tone={
                        u.role === "Admin"
                          ? "info"
                          : u.role === "Mentor"
                          ? "primary"
                          : u.role === "President"
                          ? "accent"
                          : "neutral"
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={u.status === "active" ? "success" : "danger"}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className={s.muted}>{u.joined}</td>
                  <td>
                    <div className={s.actions}>
                      <button
                        className={s.iconBtn}
                        onClick={() => toggleStatus(u.id)}
                        disabled={busyId === u.id}
                      >
                        {u.status === "active" ? (
                          <>
                            <Ban size={12} /> Disable
                          </>
                        ) : (
                          <>
                            <CheckCircle size={12} /> Enable
                          </>
                        )}
                      </button>
                      <button
                        className={`${s.iconBtn} ${s.iconBtnDanger}`}
                        onClick={() => setConfirm(u)}
                        disabled={busyId === u.id}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className={s.emptyRow}>
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {confirm && (
        <div className={s.scrim} onClick={() => setConfirm(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete {confirm.name}?</h3>
            <p>
              This will permanently remove the user, their assessments, roadmap,
              and posts from MongoDB. This cannot be undone.
            </p>
            <div className={s.modalActions}>
              <Button variant="secondary" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => remove(confirm.id)}
                disabled={busyId === confirm.id}
              >
                {busyId === confirm.id ? "Deleting…" : "Delete user"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}