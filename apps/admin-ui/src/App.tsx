import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type LoginForm = {
  username: string;
  password: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type ApiEvent = {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string | null;
  owner: string;
};

type ApiRegistration = {
  id: number;
  eventId: number;
  teamId: number;
  name: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  semester: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3000";

const emptyLoginForm: LoginForm = {
  username: "",
  password: "",
};

function getErrorMessage(value: unknown): string {
  if (typeof value !== "object" || value === null) {
    return "Request failed";
  }

  if ("error" in value && typeof value.error === "string") {
    return value.error;
  }

  if ("message" in value && typeof value.message === "string") {
    return value.message;
  }

  return "Request failed";
}

async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function App() {
  const [loginForm, setLoginForm] = useState<LoginForm>(emptyLoginForm);
  const [loginError, setLoginError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);

  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [eventsError, setEventsError] = useState("");
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const [registrations, setRegistrations] = useState<ApiRegistration[]>([]);
  const [registrationsError, setRegistrationsError] = useState("");
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    setEventsError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/events`);
      const payload = (await response.json()) as ApiResponse<ApiEvent[]>;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(getErrorMessage(payload));
      }

      setEvents(payload.data);
      setSelectedEventId((previous) => {
        if (previous && payload.data.some((event) => event.id === previous)) {
          return previous;
        }

        return payload.data[0]?.id ?? null;
      });
    } catch (error) {
      setEvents([]);
      setSelectedEventId(null);
      setEventsError(error instanceof Error ? error.message : "Failed to load events");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const loadRegistrations = async (eventId: number) => {
    setIsLoadingRegistrations(true);
    setRegistrationsError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/registrations/event/${eventId}`);
      const payload = (await response.json()) as ApiResponse<ApiRegistration[]>;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(getErrorMessage(payload));
      }

      setRegistrations(payload.data);
    } catch (error) {
      setRegistrations([]);
      setRegistrationsError(error instanceof Error ? error.message : "Failed to load registrations");
    } finally {
      setIsLoadingRegistrations(false);
    }
  };

  useEffect(() => {
    if (selectedEventId === null) {
      setRegistrations([]);
      setRegistrationsError("");
      return;
    }

    void loadRegistrations(selectedEventId);
  }, [selectedEventId]);

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAuthenticating(true);
    setLoginError("");

    try {
      const username = loginForm.username.trim();
      const hashedPassword = await sha256(loginForm.password);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, hashedPassword }),
      });

      const payload = (await response.json()) as ApiResponse<{ username: string }>;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(getErrorMessage(payload));
      }

      setLoggedInUsername(payload.data.username);
      await loadEvents();
      setLoginForm(emptyLoginForm);
    } catch (error) {
      setLoggedInUsername(null);
      setLoginError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const onLogout = () => {
    setLoggedInUsername(null);
    setLoginForm(emptyLoginForm);
    setLoginError("");

    setEvents([]);
    setSelectedEventId(null);
    setEventsError("");

    setRegistrations([]);
    setRegistrationsError("");
  };

  if (!loggedInUsername) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Sign in with your admin credentials to access event registrations.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void onLogin(event)}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={loginForm.username}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, username: event.target.value }))}
                  required
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
                  required
                />
              </div>
              {loginError ? <p className="text-sm text-destructive">{loginError}</p> : null}
              <Button className="w-full" type="submit" disabled={isAuthenticating}>
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in
                  </>
                ) : (
                  "Sign in"
                )}
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
          <CardTitle className="text-base">Welcome, {loggedInUsername}</CardTitle>
          <CardDescription>All events from API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoadingEvents ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading events...
            </div>
          ) : null}
          {eventsError ? <p className="text-sm text-destructive">{eventsError}</p> : null}
          {events.map((eventRecord) => (
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
                  {selectedEvent.date} • {selectedEvent.location} • Owner: {selectedEvent.owner}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registrations</CardTitle>
                <CardDescription>Registrations for selected event from API.</CardDescription>
              </CardHeader>
              <CardContent>
                {registrationsError ? <p className="mb-4 text-sm text-destructive">{registrationsError}</p> : null}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>College</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Team ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRegistrations ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Loading registrations...
                        </TableCell>
                      </TableRow>
                    ) : registrations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No registrations found for this event.
                        </TableCell>
                      </TableRow>
                    ) : (
                      registrations.map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell>{registration.name}</TableCell>
                          <TableCell>{registration.email}</TableCell>
                          <TableCell>{registration.phone}</TableCell>
                          <TableCell>{registration.college}</TableCell>
                          <TableCell>{registration.branch}</TableCell>
                          <TableCell>{registration.semester}</TableCell>
                          <TableCell>{registration.teamId}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No events available</CardTitle>
              <CardDescription>There are no events to display for this environment.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </main>
  );
}

export default App;
