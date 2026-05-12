import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Combobox } from "../components/Combobox";
import { EMPLOYEE_NAMES, DEPARTMENTS, JOB_TITLES, SUPERVISORS } from "../data";

export function RegisterSection() {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [job, setJob] = useState("");
  const [supervisor, setSupervisor] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ name, department, job, supervisor });
    alert("Account registered successfully!");
    setName("");
    setDepartment("");
    setJob("");
    setSupervisor("");
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Register New Account</h2>
          <p className="text-gray-600 mt-1">Add a new employee account to the system</p>
        </div>

        <div className="bg-white rounded-lg border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Name</Label>
              <Combobox
                options={EMPLOYEE_NAMES}
                value={name}
                onChange={setName}
                placeholder="Select or type name..."
                emptyMessage="No employee found."
              />
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Combobox
                options={DEPARTMENTS}
                value={department}
                onChange={setDepartment}
                placeholder="Select or type department..."
                emptyMessage="No department found."
              />
            </div>

            <div className="space-y-2">
              <Label>Job Title</Label>
              <Combobox
                options={JOB_TITLES}
                value={job}
                onChange={setJob}
                placeholder="Select or type job title..."
                emptyMessage="No job title found."
              />
            </div>

            <div className="space-y-2">
              <Label>Supervisor</Label>
              <Combobox
                options={SUPERVISORS}
                value={supervisor}
                onChange={setSupervisor}
                placeholder="Select or type supervisor..."
                emptyMessage="No supervisor found."
              />
            </div>

            <div className="pt-6 border-t">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!name || !department || !job || !supervisor}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Submit Registration
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
