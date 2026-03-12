import { useState } from "react";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/use-employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Trash2, Search, Pencil, Eye } from "lucide-react";
import { getActiveNepaliDate } from "@/lib/dateStore";
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
  const today = getActiveNepaliDate();
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
    e.department.toLowerCase().includes(search.toLowerCase()) ||
    e.designation.toLowerCase().includes(search.toLowerCase())
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
      <Input type={type} placeholder={placeholder} value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="rounded-xl"
        required={["employeeId","name","designation","department"].includes(key)} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Employee Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {today.dayOfWeek}, {today.day} {monthName} {today.year} B.S. · {employees?.length ?? 0} total employees
          </p>
        </div>
        <Button onClick={openAdd} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, ID, department..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card" />
      </div>

      {/* Table View - All fields in columns */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
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
                <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filteredEmployees?.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  <Users className="w-10 h-10 mb-2 mx-auto text-muted" />
                  No employees found.
                </TableCell></TableRow>
              ) : filteredEmployees?.map(emp => (
                <TableRow key={emp.id} className="hover:bg-muted/20">
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
    </div>
  );
}
