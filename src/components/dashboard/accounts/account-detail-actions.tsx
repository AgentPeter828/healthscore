"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Zap, FileText, Pencil } from "lucide-react";
import Link from "next/link";

interface Playbook {
  id: string;
  name: string;
  description?: string | null;
}

interface Props {
  accountId: string;
  playbooks: Playbook[];
  variant?: "note-form" | "actions";
}

export function AccountDetailActions({
  accountId,
  playbooks,
  variant = "note-form",
}: Props) {
  if (variant === "actions") {
    return <QuickActionsPanel accountId={accountId} playbooks={playbooks} />;
  }
  return <AddNoteForm accountId={accountId} />;
}

// ------------------------------------------------------------------
// Add Note Form
// ------------------------------------------------------------------

function AddNoteForm({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/accounts/${accountId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: data.content,
            type: data.type || "note",
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Failed to add note");
          return;
        }
        setOpen(false);
        form.reset();
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 w-full">
          <Plus className="w-4 h-4" />
          Add Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="note-type">Type</Label>
            <Select name="type" defaultValue="note">
              <SelectTrigger id="note-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-content">Content *</Label>
            <textarea
              id="note-content"
              name="content"
              required
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              placeholder="Add your note here..."
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Save Note
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------
// Quick Actions Panel
// ------------------------------------------------------------------

function QuickActionsPanel({
  accountId,
  playbooks,
}: {
  accountId: string;
  playbooks: Playbook[];
}) {
  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [playbookError, setPlaybookError] = useState<string | null>(null);
  const [playbookSuccess, setPlaybookSuccess] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const router = useRouter();

  async function runPlaybook() {
    if (!selectedPlaybook) return;
    setPlaybookError(null);
    setPlaybookSuccess(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/playbooks/${selectedPlaybook}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account_id: accountId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setPlaybookError(body.error ?? "Failed to run playbook");
          return;
        }
        setPlaybookSuccess("Playbook started successfully!");
        setTimeout(() => {
          setPlaybookOpen(false);
          setPlaybookSuccess(null);
          router.refresh();
        }, 1500);
      } catch {
        setPlaybookError("Something went wrong. Please try again.");
      }
    });
  }

  async function handleNoteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNoteError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/accounts/${accountId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: data.content,
            type: data.type || "note",
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setNoteError(body.error ?? "Failed to add note");
          return;
        }
        setNoteOpen(false);
        form.reset();
        router.refresh();
      } catch {
        setNoteError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-2">
      {/* Run Playbook */}
      <Dialog open={playbookOpen} onOpenChange={setPlaybookOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2" size="sm">
            <Zap className="w-4 h-4 text-yellow-500" />
            Run Playbook
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Run Playbook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Select Playbook</Label>
              {playbooks.length > 0 ? (
                <Select
                  value={selectedPlaybook}
                  onValueChange={setSelectedPlaybook}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a playbook..." />
                  </SelectTrigger>
                  <SelectContent>
                    {playbooks.map((pb) => (
                      <SelectItem key={pb.id} value={pb.id}>
                        {pb.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active playbooks.{" "}
                  <Link
                    href="/dashboard/playbooks"
                    className="text-blue-600 hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              )}
            </div>
            {playbookError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {playbookError}
              </p>
            )}
            {playbookSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                {playbookSuccess}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPlaybookOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={runPlaybook}
                disabled={!selectedPlaybook || isPending || playbooks.length === 0}
              >
                {isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Run
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2" size="sm">
            <FileText className="w-4 h-4 text-blue-500" />
            Add Note
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNoteSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="qa-note-type">Type</Label>
              <Select name="type" defaultValue="note">
                <SelectTrigger id="qa-note-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qa-note-content">Content *</Label>
              <textarea
                id="qa-note-content"
                name="content"
                required
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder="Add your note here..."
              />
            </div>
            {noteError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {noteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNoteOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Account */}
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        size="sm"
        asChild
      >
        <Link href={`/dashboard/accounts/${accountId}/edit`}>
          <Pencil className="w-4 h-4 text-slate-500" />
          Edit Account
        </Link>
      </Button>
    </div>
  );
}
