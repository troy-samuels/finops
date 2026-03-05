"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MOCK_ORG } from "@/lib/mock-data";

export default function GeneralSettingsPage() {
  const [orgName, setOrgName] = useState(MOCK_ORG.name);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2">
          <Building2 className="h-4.5 w-4.5 text-[#888888]" />
          <h2 className="text-lg font-semibold text-white">Organisation</h2>
        </div>
        <p className="mt-1 text-sm text-[#666666]">
          Update your organisation details.
        </p>
        <div className="mt-5 max-w-md space-y-5">
          <div className="space-y-2">
            <Label className="text-xs" htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs" htmlFor="org-slug">Slug</Label>
            <Input
              id="org-slug"
              value={MOCK_ORG.slug}
              disabled
              className="h-10 opacity-50"
            />
            <p className="text-xs text-[#555555]">
              Used in URLs. Cannot be changed.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => toast.success("Organisation updated")}
          >
            Save changes
          </Button>
        </div>
      </section>

      <Separator />

      <section>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4.5 w-4.5 text-red-400" />
          <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        </div>
        <p className="mt-1 text-sm text-[#666666]">
          Irreversible actions that permanently affect your organisation.
        </p>
        <div className="mt-5">
          <div className="rounded-xl bg-red-500/[0.04] p-5 ring-1 ring-red-500/[0.15]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  Delete organisation
                </p>
                <p className="mt-1 text-xs text-[#666666]">
                  This will permanently delete all projects, API keys, and usage data.
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
