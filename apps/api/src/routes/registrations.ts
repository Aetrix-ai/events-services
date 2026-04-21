import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { db } from '../lib/db';
import { registrations, teams, events } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const router: ExpressRouter = Router();

// Get all registrations for an event
router.get('/event/:eventId', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID',
      });
    }

    const eventRegistrations = await db.query.registrations.findMany({
      where: eq(registrations.eventId, eventId),
      with: {
        team: true,
      },
    });

    res.json({
      success: true,
      data: eventRegistrations,
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registrations',
    });
  }
});

// Get single registration by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const registrationId = parseInt(req.params.id as string);
    
    if (isNaN(registrationId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid registration ID',
      });
    }

    const registration = await db.query.registrations.findFirst({
      where: eq(registrations.id, registrationId),
      with: {
        team: {
          with: {
            members: true,
          },
        },
        event: true,
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
      });
    }

    res.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registration',
    });
  }
});

// Create new registration with new team
router.post('/new-team', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      college, 
      branch, 
      semester, 
      teamName, 
      eventId 
    } = req.body;

    // Validation
    if (!name || !college || !branch || !semester || !teamName || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, college, branch, semester, teamName, eventId',
      });
    }

    // Check if event exists
    const event = await db.select().from(events).where(eq(events.id, eventId));
    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Create team first
    const [newTeam] = await db.insert(teams).values({
      name: teamName,
      eventId,
    }).returning();

    // Create registration
    const [newRegistration] = await db.insert(registrations).values({
      name,
      college,
      branch,
      semester,
      teamId: newTeam.id,
      eventId,
    }).returning();

    // Fetch complete registration with team info
    const completeRegistration = await db.query.registrations.findFirst({
      where: eq(registrations.id, newRegistration.id),
      with: {
        team: true,
        event: true,
      },
    });

    res.status(201).json({
      success: true,
      data: completeRegistration,
      message: 'Registration created successfully with new team',
    });
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create registration',
    });
  }
});

// Create new registration with existing team
router.post('/join-team', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      college, 
      branch, 
      semester, 
      teamId, 
      eventId 
    } = req.body;

    // Validation
    if (!name || !college || !branch || !semester || !teamId || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, college, branch, semester, teamId, eventId',
      });
    }

    // Check if team exists and belongs to the event
    const team = await db.query.teams.findFirst({
      where: and(
        eq(teams.id, teamId),
        eq(teams.eventId, eventId)
      ),
      with: {
        event: true,
        members: true,
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found or does not belong to this event',
      });
    }

    // Check if team is full
    if (team.members.length >= team.event.teamSize) {
      return res.status(400).json({
        success: false,
        error: `Team is full. Maximum team size is ${team.event.teamSize}`,
      });
    }

    // Create registration
    const [newRegistration] = await db.insert(registrations).values({
      name,
      college,
      branch,
      semester,
      teamId,
      eventId,
    }).returning();

    // Fetch complete registration with team info
    const completeRegistration = await db.query.registrations.findFirst({
      where: eq(registrations.id, newRegistration.id),
      with: {
        team: {
          with: {
            members: true,
          },
        },
        event: true,
      },
    });

    res.status(201).json({
      success: true,
      data: completeRegistration,
      message: 'Successfully joined the team',
    });
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create registration',
    });
  }
});

// Update registration
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const registrationId = parseInt(req.params.id as string);
    
    if (isNaN(registrationId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid registration ID',
      });
    }

    const { name, college, branch, semester } = req.body;

    // Check if registration exists
    const existingRegistration = await db.select()
      .from(registrations)
      .where(eq(registrations.id, registrationId));
    
    if (existingRegistration.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
      });
    }

    const [updatedRegistration] = await db.update(registrations)
      .set({
        ...(name && { name }),
        ...(college && { college }),
        ...(branch && { branch }),
        ...(semester && { semester }),
        updatedAt: new Date(),
      })
      .where(eq(registrations.id, registrationId))
      .returning();

    res.json({
      success: true,
      data: updatedRegistration,
      message: 'Registration updated successfully',
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update registration',
    });
  }
});

// Delete registration
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const registrationId = parseInt(req.params.id as string);
    
    if (isNaN(registrationId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid registration ID',
      });
    }

    // Check if registration exists
    const existingRegistration = await db.select()
      .from(registrations)
      .where(eq(registrations.id, registrationId));
    
    if (existingRegistration.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
      });
    }

    await db.delete(registrations).where(eq(registrations.id, registrationId));

    res.json({
      success: true,
      message: 'Registration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete registration',
    });
  }
});

export default router;

// Made with Bob
