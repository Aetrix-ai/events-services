import { useMemo, useState } from "react";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminUsers, events, type RegistrationRecord, registrations as registrationSeed, teams } from "@/data/schema";

type LoginForm = {
  username: string;
  password: string;
};

type RegistrationDraft = Pick<RegistrationRecord, "attendeeName" | "email" | "status" | "teamId">;

const emptyDraft: RegistrationDraft = {
  attendeeName: "",
  email: "",
  status: "pending",
  teamId: "",
};

function App() {
  const [loginForm, setLoginForm] = useState<LoginForm>({ username: "", password: "" });
  const [loginError, setLoginError] = useState<string>("");
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  const [registrationRows, setRegistrationRows] = useState<RegistrationRecord[]>(registrationSeed);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newRegistration, setNewRegistration] = useState<RegistrationDraft>(emptyDraft);
  const [editingRegistrationId, setEditingRegistrationId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<RegistrationDraft>(emptyDraft);

  const currentAdmin = useMemo(() => adminUsers.find((admin) => admin.id === currentAdminId) ?? null, [currentAdminId]);

  const availableEvents = useMemo(() => {
    if (!currentAdmin) {
      return [];
    }

    return events.filter((event) => event.ownerId === currentAdmin.id || event.involvedAdminIds.includes(currentAdmin.id));
  }, [currentAdmin]);

  const selectedEvent = useMemo(
    () => availableEvents.find((event) => event.id === selectedEventId) ?? availableEvents[0] ?? null,
    [availableEvents, selectedEventId]
  );

  const filteredRegistrations = useMemo(() => {
    if (!selectedEvent) {
      return [];
    }

    return registrationRows.filter((registration) => registration.eventId === selectedEvent.id);
  }, [registrationRows, selectedEvent]);

  const filteredTeams = useMemo(() => {
    if (!selectedEvent) {
      return [];
    }

    return teams.filter((team) => team.eventId === selectedEvent.id);
  }, [selectedEvent]);

  const onLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const admin = adminUsers.find(
      (candidate) => candidate.username === loginForm.username.trim() && candidate.password === loginForm.password
    );

    if (!admin) {
      setLoginError("Invalid username or password from schema credentials.");
      return;
    }

    setCurrentAdminId(admin.id);
    setSelectedEventId(
      events.find((record) => record.ownerId === admin.id || record.involvedAdminIds.includes(admin.id))?.id ?? null
    );
    setLoginError("");
  };

  const onLogout = () => {
    setCurrentAdminId(null);
    setSelectedEventId(null);
    setLoginForm({ username: "", password: "" });
    setLoginError("");
  };

  const onAddRegistration = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedEvent) {
      return;
    }

    setRegistrationRows((previous) => [
      ...previous,
      {
        id: `reg-${crypto.randomUUID()}`,
        eventId: selectedEvent.id,
        attendeeName: newRegistration.attendeeName.trim(),
        email: newRegistration.email.trim(),
        status: newRegistration.status,
        teamId: newRegistration.teamId.trim(),
      },
    ]);
    setNewRegistration(emptyDraft);
  };

  const onStartEdit = (registration: RegistrationRecord) => {
    setEditingRegistrationId(registration.id);
    setEditingDraft({
      attendeeName: registration.attendeeName,
      email: registration.email,
      status: registration.status,
      teamId: registration.teamId,
    });
  };

  const onSaveEdit = () => {
    if (!editingRegistrationId) {
      return;
    }

    setRegistrationRows((previous) =>
      previous.map((registration) =>
        registration.id === editingRegistrationId
          ? {
              ...registration,
              attendeeName: editingDraft.attendeeName.trim(),
              email: editingDraft.email.trim(),
              status: editingDraft.status,
              teamId: editingDraft.teamId.trim(),
            }
          : registration
      )
    );

    setEditingRegistrationId(null);
    setEditingDraft(emptyDraft);
  };

  const onDeleteRegistration = (registrationId: string) => {
    setRegistrationRows((previous) => previous.filter((registration) => registration.id !== registrationId));
  };

  if (!currentAdmin) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Use username/password defined in schema data to access registrations.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onLogin}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={loginForm.username}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, username: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))}
                />
              </div>
              {loginError ? <p className="text-sm text-destructive">{loginError}</p> : null}
              <Button className="w-full" type="submit">
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Welcome, {currentAdmin.fullName}</CardTitle>
          <CardDescription>Events you own or are involved in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {availableEvents.map((eventRecord) => (
            <Button
              key={eventRecord.id}
              variant={selectedEvent?.id === eventRecord.id ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setSelectedEventId(eventRecord.id)}
            >
              {eventRecord.name}
            </Button>
          ))}
          <Button className="mt-3 w-full" variant="secondary" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-4">
        {selectedEvent ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{selectedEvent.name}</CardTitle>
                <CardDescription>
                  {selectedEvent.date} • {selectedEvent.location}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registrations</CardTitle>
                <CardDescription>Excel-style editable registration grid for this event.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="grid gap-2 md:grid-cols-5" onSubmit={onAddRegistration}>
                  <Input
                    placeholder="Attendee name"
                    value={newRegistration.attendeeName}
                    onChange={(event) =>
                      setNewRegistration((previous) => ({ ...previous, attendeeName: event.target.value }))
                    }
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={newRegistration.email}
                    onChange={(event) => setNewRegistration((previous) => ({ ...previous, email: event.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Status"
                    value={newRegistration.status}
                    onChange={(event) =>
                      setNewRegistration((previous) => ({
                        ...previous,
                        status: event.target.value as RegistrationRecord["status"],
                      }))
                    }
                    required
                  />
                  <Input
                    placeholder="Team ID"
                    value={newRegistration.teamId}
                    onChange={(event) => setNewRegistration((previous) => ({ ...previous, teamId: event.target.value }))}
                    required
                  />
                  <Button type="submit" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </form>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Team ID</TableHead>
                      <TableHead className="w-[170px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map((registration) => {
                      const isEditing = editingRegistrationId === registration.id;

                      return (
                        <TableRow key={registration.id}>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editingDraft.attendeeName}
                                onChange={(event) =>
                                  setEditingDraft((previous) => ({ ...previous, attendeeName: event.target.value }))
                                }
                              />
                            ) : (
                              registration.attendeeName
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editingDraft.email}
                                onChange={(event) =>
                                  setEditingDraft((previous) => ({ ...previous, email: event.target.value }))
                                }
                              />
                            ) : (
                              registration.email
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editingDraft.status}
                                onChange={(event) =>
                                  setEditingDraft((previous) => ({
                                    ...previous,
                                    status: event.target.value as RegistrationRecord["status"],
                                  }))
                                }
                              />
                            ) : (
                              <Badge variant="secondary">{registration.status}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editingDraft.teamId}
                                onChange={(event) =>
                                  setEditingDraft((previous) => ({ ...previous, teamId: event.target.value }))
                                }
                              />
                            ) : (
                              registration.teamId
                            )}
                          </TableCell>
                          <TableCell className="space-x-2">
                            {isEditing ? (
                              <>
                                <Button size="sm" onClick={onSaveEdit}>
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingRegistrationId(null);
                                    setEditingDraft(emptyDraft);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => onStartEdit(registration)}>
                                  <Pencil className="mr-1 h-3 w-3" /> Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => onDeleteRegistration(registration.id)}
                                >
                                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>Related teams for the selected event.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Lead Email</TableHead>
                      <TableHead>Members</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>{team.teamName}</TableCell>
                        <TableCell>{team.leadEmail}</TableCell>
                        <TableCell>{team.membersCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No events available</CardTitle>
              <CardDescription>No events are mapped to this admin account.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </main>
  );
}

export default App;
