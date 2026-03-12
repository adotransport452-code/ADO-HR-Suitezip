import { useState } from "react";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/use-employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, Trash2, Search, Pencil, Eye } from "lucide-react";
import { getCurrentNepaliDate } from "@/lib/nepaliDate";
import { NEPALI_MONTHS } from "@/lib/constants";
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

export default function Employees() {
  const today = getCurrentNepaliDate();
  const monthName = NEPALI_MONTHS.find(m => m.value === today.month)?.label ?? "";
  const { data: employees, isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [viewEmp, setViewEmp] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const filteredEmployees = employees?.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

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

  const fld = (label: string, key: keyof FormData, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <Input
        type={type} placeholder={placeholder} value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="rounded-xl"
        required={["employeeId","name","designation","department"].includes(key)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Employee Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {today.dayOfWeek}, {today.day} {monthName} {today.year} B.S. · {employees?.length ?? 0} employees
          </p>
        </div>
        <Button onClick={openAdd} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID or department..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 rounded-xl bg-card"
        />
      </div>

      {/* Employee Cards Grid (all fields visible) */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filteredEmployees?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
          <Users className="w-12 h-12 mb-3 text-muted" />
          No employees found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEmployees?.map(emp => (
            <div key={emp.id} className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-border/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold text-lg">
                  {emp.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{emp.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{emp.employeeId}</p>
                </div>
                <div className="flex gap-1">
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
              </div>
              <div className="px-5 py-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Designation</p>
                    <p className="font-medium text-foreground">{emp.designation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium text-foreground">{emp.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="font-medium text-foreground">{emp.contactNumber || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="font-medium text-foreground">{emp.dateOfBirth || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Joining</p>
                    <p className="font-medium text-foreground">{emp.dateOfJoining || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bank Account</p>
                    <p className="font-medium text-foreground">{emp.bankAccountNumber || "—"}</p>
                  </div>
                </div>
                {emp.address && (
                  <div className="text-sm border-t border-border/30 pt-2">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium text-foreground">{emp.address}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[580px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">{editId ? "Edit Employee" : "New Employee"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {fld("Employee ID *", "employeeId", "text", "EMP-001")}
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
            <div className="mt-4 space-y-2.5">
              {[
                ["Employee ID", viewEmp.employeeId], ["Full Name", viewEmp.name],
                ["Designation", viewEmp.designation], ["Department", viewEmp.department],
                ["Contact Number", viewEmp.contactNumber], ["Date of Birth", viewEmp.dateOfBirth],
                ["Address", viewEmp.address], ["Date of Joining", viewEmp.dateOfJoining],
                ["Bank Account No.", viewEmp.bankAccountNumber]
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground font-medium">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{val || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
