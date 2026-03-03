"use client";

import { useState } from "react";
import { toast } from "sonner";
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
        <h2 className="text-lg font-semibold text-white">Organization</h2>
        <p className="mt-1 text-sm text-[#666666]">
          Update your organization details.
        </p>
        <div className="mt-4 max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug</Label>
            <Input
              id="org-slug"
              value={MOCK_ORG.slug}
              disabled
              className="opacity-50"
            />
            <p className="text-xs text-[#555555]">
              Used in URLs. Cannot be changed.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => toast.success("Organization updated")}
          >
            Save changes
          </Button>
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        <p className="mt-1 text-sm text-[#666666]">
          Irreversible actions that permanently affect your organization.
        </p>
        <div className="mt-4">
          <div className="rounded-lg p-4 ring-1 ring-destructive/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  Delete organization
                </p>
                <p className="text-xs text-[#666666]">
                  This will permanently delete all projects, keys, and data.
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
