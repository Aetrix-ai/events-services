import { Router, Request, Response } from 'express';
import { db } from '../lib/db';
import { events, teams, registrations, credentials } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// Helper function to create or update credentials
async function upsertCredentials(username: string, hashedPassword: string): Promise<void> {
  // Check if credential exists
  const [existing] = await db.select()
    .from(credentials)
    .where(eq(credentials.username, username));
  
  if (existing) {
    // Update existing credential
    await db.update(credentials)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(credentials.username, username));
  } else {
    // Create new credential
    await db.insert(credentials).values({
      username,
      password: hashedPassword,
    });
  }
}

// Get all events
router.get('/', async (req: Request, res: Response) => {
  try {
    const allEvents = await db.select().from(events).orderBy(desc(events.createdAt));
    res.json({
      success: true,
      data: allEvents,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
    });
  }
});

// Get single event by ID with teams and registrations
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID',
      });
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        teams: {
          with: {
            members: true,
          },
        },
        registrations: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event',
    });
  }
});

// Create new event (auto-creates/updates credentials)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      date,
      location,
      description,
      owner,
      teamSize,
      hashedPassword  // Expecting already hashed password from external app
    } = req.body;

    // Validation
    if (!name || !date || !location || !owner || !teamSize || !hashedPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, date, location, owner, teamSize, hashedPassword',
      });
    }

    if (teamSize < 1) {
      return res.status(400).json({
        success: false,
        error: 'Team size must be at least 1',
      });
    }

    // Auto-create or update credentials
    await upsertCredentials(owner, hashedPassword);

    // Create event
    const [newEvent] = await db.insert(events).values({
      name,
      date,
      location,
      description: description || null,
      owner,
      teamSize,
    }).returning();

    res.status(201).json({
      success: true,
      data: newEvent,
      message: 'Event created successfully. Credentials updated.',
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event',
    });
  }
});

// Update event
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID',
      });
    }

    const { name, date, location, description, owner, teamSize } = req.body;

    // Check if event exists
    const existingEvent = await db.select().from(events).where(eq(events.id, eventId));
    if (existingEvent.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    const [updatedEvent] = await db.update(events)
      .set({
        ...(name && { name }),
        ...(date && { date }),
        ...(location && { location }),
        ...(description !== undefined && { description }),
        ...(owner && { owner }),
        ...(teamSize && { teamSize }),
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    res.json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event',
    });
  }
});

// Delete event
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID',
      });
    }

    // Check if event exists
    const existingEvent = await db.select().from(events).where(eq(events.id, eventId));
    if (existingEvent.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    await db.delete(events).where(eq(events.id, eventId));

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
    });
  }
});

// Get event statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID',
      });
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        teams: {
          with: {
            members: true,
          },
        },
        registrations: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    const stats = {
      totalTeams: event.teams.length,
      totalRegistrations: event.registrations.length,
      teamSize: event.teamSize,
      teamsWithFullCapacity: event.teams.filter(team => team.members.length >= event.teamSize).length,
      availableSlots: event.teams.reduce((acc, team) => {
        const remaining = event.teamSize - team.members.length;
        return acc + (remaining > 0 ? remaining : 0);
      }, 0),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event statistics',
    });
  }
});

export default router;

// Made with Bob
