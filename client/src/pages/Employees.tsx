import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/use-employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Trash2, Search, Pencil, Eye, Upload, Download, MousePointer2, Check } from "lucide-react";
import { useActiveDate } from "@/hooks/use-active-date";
import { NEPALI_MONTHS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Employee } from "@shared/schema";

type FormData = {
  employeeId: string; name: string; designation: string; department: string;
  contactNumber: string; dateOfBirth: string; address: string;
  dateOfJoining: string; bankAccountNumber: string;
};

const emptyForm: FormData = {
  employeeId: "", name: "", designation: "", department: "",
  contactNumber: "", dateOfBirth: "", address: "", dateOfJoining: "", bankAccountNumber: ""
};

interface ImportedRow {
  employeeId: string; name: string; designation: string; department: string;
  contactNumber: string; dateOfBirth: string; address: string;
  dateOfJoining: string; bankAccountNumber: string;
}

export default function Employees() {
  const today = useActiveDate();
  const monthName = NEPALI_MONTHS.find(m => m.value === today.month)?.label ?? "";
  const { toast } = useToast();
  const { data: employees, isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [viewEmp, setViewEmp] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Import state
  const [importRows, setImportRows] = useState<ImportedRow[]>([]);
  const [importText, setImportText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEmployees = employees?.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.designation || "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const openAdd = () => { setEditId(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (emp: Employee) => {
    setEditId(emp.id);
    setForm({
      employeeId: emp.employeeId, name: emp.name, designation: emp.designation, department: emp.department,
      contactNumber: emp.contactNumber ?? "", dateOfBirth: emp.dateOfBirth ?? "",
      address: emp.address ?? "", dateOfJoining: emp.dateOfJoining ?? "",
      bankAccountNumber: emp.bankAccountNumber ?? ""
    });
    setFormOpen(true);
  };
  const openView = (emp: Employee) => { setViewEmp(emp); setViewOpen(true); };

  const toggleRow = (id: number) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selectedIds.size === filteredEmployees.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredEmployees.map(e => e.id)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      employeeId: form.employeeId, name: form.name, designation: form.designation, department: form.department,
      contactNumber: form.contactNumber || null, dateOfBirth: form.dateOfBirth || null,
      address: form.address || null, dateOfJoining: form.dateOfJoining || null,
      bankAccountNumber: form.bankAccountNumber || null
    };
    if (editId) {
      updateEmployee.mutate({ id: editId, data: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createEmployee.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  // Export to Excel
  const exportExcel = () => {
    const toExport = (selectMode && selectedIds.size > 0)
      ? filteredEmployees.filter(e => selectedIds.has(e.id))
      : filteredEmployees;
    const rows = toExport.map(e => ({
      "Employee ID": e.employeeId, "Name": e.name, "Designation": e.designation, "Department": e.department,
      "Contact": e.contactNumber ?? "", "Date of Birth": e.dateOfBirth ?? "",
      "Date of Joining": e.dateOfJoining ?? "", "Address": e.address ?? "",
      "Bank Account": e.bankAccountNumber ?? ""
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "Employees_Deego_Textiles.xlsx");
    toast({ title: "Exported", description: `${rows.length} employees exported to Excel.` });
  };

  // Parse imported Excel/CSV file
  const normalizeHeader = (h: string) => h.toLowerCase().replace(/\s|_/g, "");
  const mapRow = (headerMap: Record<string, number>, row: any[]): ImportedRow => {
    const get = (keys: string[]) => {
      for (const k of keys) { if (headerMap[k] !== undefined && row[headerMap[k]]) return String(row[headerMap[k]]).trim(); }
      return "";
    };
    return {
      employeeId: get(["employeeid","empid","id","empno","employeeno"]),
      name: get(["name","fullname","employeename","empname"]),
      designation: get(["designation","position","jobtitle","role","title"]),
      department: get(["department","dept","division","team"]),
      contactNumber: get(["contact","contactnumber","phone","mobile","phonenumber"]),
      dateOfBirth: get(["dateofbirth","dob","birthdate"]),
      dateOfJoining: get(["dateofjoining","joiningdate","startdate","joindate"]),
      address: get(["address","location","city"]),
      bankAccountNumber: get(["bankaccount","bankaccountnumber","accountno","accountnumber"])
    };
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (!json.length) return;
        const headers = (json[0] as any[]).map(h => normalizeHeader(String(h)));
        const headerMap: Record<string, number> = {};
        headers.forEach((h, i) => { headerMap[h] = i; });
        const rows = json.slice(1).filter(row => row.some(Boolean)).map(row => mapRow(headerMap, row));
        setImportRows(rows);
        if (rows.length === 0) toast({ title: "No data found", variant: "destructive" });
      } catch { toast({ title: "Failed to parse file", variant: "destructive" }); }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const parseImportText = () => {
    if (!importText.trim()) return;
    const lines = importText.trim().split("\n");
    const firstLine = lines[0].split(/\t|,/).map(h => normalizeHeader(h));
    const hasHeader = firstLine.some(h => ["name","employeeid","designation"].includes(h));
    let rows: ImportedRow[];
    if (hasHeader) {
      const headerMap: Record<string, number> = {};
      firstLine.forEach((h, i) => { headerMap[h] = i; });
      rows = lines.slice(1).filter(l => l.trim()).map(l => mapRow(headerMap, l.split(/\t|,/).map(c => c.trim())));
    } else {
      // Assume columns: ID, Name, Designation, Department, Contact, DOB, Joining, Address, Bank
      rows = lines.filter(l => l.trim()).map(l => {
        const c = l.split(/\t|,/).map(s => s.trim());
        return { employeeId: c[0]||"", name: c[1]||"", designation: c[2]||"", department: c[3]||"",
          contactNumber: c[4]||"", dateOfBirth: c[5]||"", dateOfJoining: c[6]||"", address: c[7]||"", bankAccountNumber: c[8]||"" };
      });
    }
    setImportRows(rows);
    if (rows.length === 0) toast({ title: "No data found", variant: "destructive" });
  };

  const confirmImport = async () => {
    let saved = 0;
    for (const row of importRows) {
      if (!row.name) continue;
      await new Promise<void>(resolve => {
        createEmployee.mutate({
          employeeId: row.employeeId || `IMP${Date.now()}${Math.random().toString(36).slice(2,5)}`,
          name: row.name, designation: row.designation, department: row.department,
          contactNumber: row.contactNumber || null, dateOfBirth: row.dateOfBirth || null,
          dateOfJoining: row.dateOfJoining || null, address: row.address || null,
          bankAccountNumber: row.bankAccountNumber || null
        }, { onSuccess: () => { saved++; resolve(); }, onError: () => resolve() });
      });
    }
    setImportOpen(false);
    setImportRows([]);
    setImportText("");
    toast({ title: "Import complete", description: `${saved} employees added.` });
  };

  const fld = (label: string, key: keyof FormData, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <Input type={type} placeholder={placeholder} value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="rounded-xl"
        required={["employeeId","name","designation","department"].includes(key)} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Employee Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {`${today.year}-${String(today.month).padStart(2,"0")}-${String(today.day).padStart(2,"0")} (BS)`} · {employees?.length ?? 0} employees
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className={cn("rounded-xl", selectMode && "bg-primary/10 border-primary text-primary")}
            onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}>
            <MousePointer2 className="w-4 h-4 mr-1.5" /> {selectMode ? "Exit Select" : "Select"}
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setImportRows([]); setImportText(""); setImportOpen(true); }}>
            <Upload className="w-4 h-4 mr-1.5" /> Import
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={exportExcel}>
            <Download className="w-4 h-4 mr-1.5" /> Export {selectMode && selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
          <Button onClick={openAdd} size="sm" className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-1.5" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Delete selected */}
      {selectMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-sm font-medium text-red-700">{selectedIds.size} selected</span>
          <Button size="sm" variant="destructive" className="rounded-xl ml-auto"
            onClick={() => {
              if (confirm(`Delete ${selectedIds.size} employees?`)) {
                selectedIds.forEach(id => deleteEmployee.mutate(id));
                setSelectedIds(new Set());
              }
            }}>
            <Trash2 className="w-4 h-4 mr-1.5" /> Delete Selected
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, ID, department..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card" />
      </div>

      {/* Employee Table */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                {selectMode && (
                  <TableHead className="w-10">
                    <Checkbox checked={selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                      onCheckedChange={toggleAll} />
                  </TableHead>
                )}
                <TableHead className="font-bold text-foreground whitespace-nowrap">Emp. ID</TableHead>
                <TableHead className="font-bold text-foreground whitespace-nowrap">Full Name</TableHead>
                <TableHead className="font-bold text-foreground whitespace-nowrap">Designation</TableHead>
                <TableHead className="font-bold text-foreground whitespace-nowrap">Department</TableHead>
                <TableHead className="font-bold text-foreground whitespace-nowrap">Contact</TableHead>
                <TableHead className="font-bold text-foreground whitespace-nowrap">Date of Birth</TableHead>
                <TableHead className="font-bold text-foreground whitespace-nowrap">Date of Joining</TableHead>
                <TableHead className="font-bold text-foreground whitespace-nowrap">Address</TableHead>
                <TableHead className="font-bold text-foreground whitespace-nowrap">Bank Account</TableHead>
                <TableHead className="font-bold text-foreground text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={selectMode ? 11 : 10} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow><TableCell colSpan={selectMode ? 11 : 10} className="text-center py-12 text-muted-foreground">
                  <Users className="w-10 h-10 mb-2 mx-auto text-muted" />
                  No employees found.
                </TableCell></TableRow>
              ) : filteredEmployees.map(emp => (
                <TableRow key={emp.id} className={cn("hover:bg-muted/20", selectedIds.has(emp.id) && "bg-primary/5")}>
                  {selectMode && (
                    <TableCell className="w-10">
                      <Checkbox checked={selectedIds.has(emp.id)} onCheckedChange={() => toggleRow(emp.id)} />
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-xs font-semibold text-primary whitespace-nowrap">{emp.employeeId}</TableCell>
                  <TableCell className="font-semibold whitespace-nowrap">{emp.name}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{emp.designation}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{emp.department}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{emp.contactNumber || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{emp.dateOfBirth || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{emp.dateOfJoining || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate" title={emp.address ?? ""}>{emp.address || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm font-mono whitespace-nowrap">{emp.bankAccountNumber || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground" onClick={() => openView(emp)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-blue-500 hover:bg-blue-50" onClick={() => openEdit(emp)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm(`Remove ${emp.name}?`)) deleteEmployee.mutate(emp.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">{editId ? "Edit Employee" : "New Employee"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {fld("Employee ID *", "employeeId", "text", "DE001")}
              {fld("Full Name *", "name", "text", "Ram Bahadur")}
              {fld("Designation *", "designation", "text", "Manager")}
              {fld("Department *", "department", "text", "Production")}
              {fld("Contact Number", "contactNumber", "tel", "98XXXXXXXX")}
              {fld("Date of Birth", "dateOfBirth", "text", "2048-01-15")}
              {fld("Date of Joining", "dateOfJoining", "text", "2075-06-01")}
              {fld("Bank Account No.", "bankAccountNumber", "text", "XXXXXXXXX")}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Address</label>
              <Input placeholder="Kathmandu, Bagmati Province" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={createEmployee.isPending || updateEmployee.isPending}>
              {createEmployee.isPending || updateEmployee.isPending ? "Saving..." : editId ? "Save Changes" : "Create Employee"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-display">Employee Details</DialogTitle></DialogHeader>
          {viewEmp && (
            <div className="mt-4 space-y-2">
              {([
                ["Employee ID", viewEmp.employeeId], ["Full Name", viewEmp.name],
                ["Designation", viewEmp.designation], ["Department", viewEmp.department],
                ["Contact Number", viewEmp.contactNumber], ["Date of Birth", viewEmp.dateOfBirth],
                ["Date of Joining", viewEmp.dateOfJoining], ["Address", viewEmp.address],
                ["Bank Account No.", viewEmp.bankAccountNumber]
              ] as [string, string | null][]).map(([label, val]) => (
                <div key={label} className="flex justify-between items-start py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground font-medium">{label}</span>
                  <span className="text-sm font-semibold text-foreground text-right max-w-[250px]">{val || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-[620px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Import Employees</DialogTitle>
            <p className="text-sm text-muted-foreground">Import employees from Excel, CSV, or pasted text.</p>
          </DialogHeader>

          <div className="space-y-5 mt-3">
            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1.5"><Upload className="w-4 h-4 text-primary" /> Upload Excel / CSV File</label>
              <div className="border-2 border-dashed border-border rounded-xl p-5 text-center bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept=".xlsx,.csv,.xls" className="hidden" onChange={handleImportFile} />
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Click to upload Excel or CSV</p>
                <p className="text-xs text-muted-foreground mt-1">Columns auto-detected: Employee ID, Name, Designation, Department, Phone, etc.</p>
              </div>
            </div>

            {/* Paste Text */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Paste Excel Data</label>
              <textarea
                className="w-full h-24 rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={"Employee ID\tName\tDesignation\tDepartment\tContact\nDE001\tRam Bahadur\tManager\tProduction\t9800000000"}
                value={importText}
                onChange={e => setImportText(e.target.value)}
              />
              <Button variant="outline" className="rounded-xl w-full" onClick={parseImportText}>Parse Pasted Text</Button>
              <p className="text-xs text-muted-foreground">Copy rows from Excel, paste here, then click Parse. Include a header row or use: ID, Name, Designation, Department order.</p>
            </div>

            {/* Preview */}
            {importRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-emerald-700">{importRows.length} employees ready to import</label>
                  <button onClick={() => setImportRows([])} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
                </div>
                <div className="border border-border/50 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 sticky top-0">
                      <tr>{["ID","Name","Designation","Department","Contact"].map(h => <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {importRows.map((r, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="px-3 py-1.5 font-mono">{r.employeeId || "—"}</td>
                          <td className="px-3 py-1.5 font-medium">{r.name}</td>
                          <td className="px-3 py-1.5">{r.designation || "—"}</td>
                          <td className="px-3 py-1.5">{r.department || "—"}</td>
                          <td className="px-3 py-1.5">{r.contactNumber || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button className="w-full rounded-xl" onClick={confirmImport} disabled={createEmployee.isPending}>
                  <Check className="w-4 h-4 mr-1.5" />
                  {createEmployee.isPending ? "Importing..." : `Confirm Import (${importRows.length} employees)`}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
