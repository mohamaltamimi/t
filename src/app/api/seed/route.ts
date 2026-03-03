import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // Clear existing data
    await prisma.trainingProgress.deleteMany();
    await prisma.trainingModule.deleteMany();
    await prisma.training.deleteMany();
    await prisma.auditResponse.deleteMany();
    await prisma.auditQuestion.deleteMany();
    await prisma.audit.deleteMany();
    await prisma.checklistResponse.deleteMany();
    await prisma.checklistItem.deleteMany();
    await prisma.checklist.deleteMany();
    await prisma.sOP.deleteMany();
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    await prisma.location.deleteMany();

    // Create locations
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          name: "Downtown Flagship Store",
          address: "123 Main Street",
          city: "New York",
          region: "Northeast",
          type: "store",
          status: "active",
        },
      }),
      prisma.location.create({
        data: {
          name: "Mall of America Branch",
          address: "456 Shopping Ave",
          city: "Minneapolis",
          region: "Midwest",
          type: "store",
          status: "active",
        },
      }),
      prisma.location.create({
        data: {
          name: "Central Kitchen",
          address: "789 Industrial Blvd",
          city: "Chicago",
          region: "Midwest",
          type: "restaurant",
          status: "active",
        },
      }),
      prisma.location.create({
        data: {
          name: "West Coast Office",
          address: "321 Tech Lane",
          city: "San Francisco",
          region: "West",
          type: "office",
          status: "active",
        },
      }),
      prisma.location.create({
        data: {
          name: "Distribution Center",
          address: "555 Logistics Way",
          city: "Dallas",
          region: "South",
          type: "warehouse",
          status: "active",
        },
      }),
    ]);

    // Create users
    const hashedAdmin = await bcrypt.hash("admin123", 10);
    const hashedManager = await bcrypt.hash("manager123", 10);
    const hashedStaff = await bcrypt.hash("staff123", 10);

    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: "Sarah Admin",
          email: "admin@wooqer.com",
          password: hashedAdmin,
          role: "admin",
        },
      }),
      prisma.user.create({
        data: {
          name: "Mike Manager",
          email: "manager@wooqer.com",
          password: hashedManager,
          role: "manager",
          locationId: locations[0].id,
        },
      }),
      prisma.user.create({
        data: {
          name: "John Staff",
          email: "staff@wooqer.com",
          password: hashedStaff,
          role: "frontline",
          locationId: locations[0].id,
        },
      }),
      prisma.user.create({
        data: {
          name: "Emily Chen",
          email: "emily@wooqer.com",
          password: hashedStaff,
          role: "frontline",
          locationId: locations[1].id,
        },
      }),
      prisma.user.create({
        data: {
          name: "David Wilson",
          email: "david@wooqer.com",
          password: hashedManager,
          role: "manager",
          locationId: locations[2].id,
        },
      }),
      prisma.user.create({
        data: {
          name: "Lisa Martinez",
          email: "lisa@wooqer.com",
          password: hashedStaff,
          role: "frontline",
          locationId: locations[2].id,
        },
      }),
    ]);

    // Create tasks
    await Promise.all([
      prisma.task.create({
        data: {
          title: "Complete morning store opening checklist",
          description: "Ensure all opening procedures are followed including lights, displays, and POS systems.",
          status: "completed",
          priority: "high",
          category: "operations",
          creatorId: users[1].id,
          assigneeId: users[2].id,
          locationId: locations[0].id,
          dueDate: new Date(Date.now() - 86400000),
        },
      }),
      prisma.task.create({
        data: {
          title: "Restock dairy section",
          description: "Restock all dairy products from the morning delivery. Check expiry dates.",
          status: "in_progress",
          priority: "medium",
          category: "inventory",
          creatorId: users[1].id,
          assigneeId: users[3].id,
          locationId: locations[1].id,
          dueDate: new Date(Date.now() + 86400000),
        },
      }),
      prisma.task.create({
        data: {
          title: "Deep clean kitchen equipment",
          description: "Monthly deep cleaning of all kitchen equipment including ovens, fryers, and prep stations.",
          status: "pending",
          priority: "urgent",
          category: "hygiene",
          creatorId: users[4].id,
          assigneeId: users[5].id,
          locationId: locations[2].id,
          dueDate: new Date(Date.now() + 172800000),
        },
      }),
      prisma.task.create({
        data: {
          title: "Update visual merchandising display",
          description: "Set up new seasonal displays per the latest VM guidelines shared in the SOP.",
          status: "pending",
          priority: "medium",
          category: "merchandising",
          creatorId: users[0].id,
          assigneeId: users[2].id,
          locationId: locations[0].id,
          dueDate: new Date(Date.now() + 259200000),
        },
      }),
      prisma.task.create({
        data: {
          title: "Conduct staff safety briefing",
          description: "Weekly safety briefing covering fire exits, first aid, and emergency procedures.",
          status: "overdue",
          priority: "high",
          category: "safety",
          creatorId: users[0].id,
          assigneeId: users[1].id,
          locationId: locations[0].id,
          dueDate: new Date(Date.now() - 172800000),
        },
      }),
      prisma.task.create({
        data: {
          title: "Inventory count - electronics section",
          description: "Complete full inventory count of electronics section and report discrepancies.",
          status: "pending",
          priority: "high",
          category: "inventory",
          creatorId: users[1].id,
          assigneeId: users[3].id,
          locationId: locations[1].id,
          dueDate: new Date(Date.now() + 86400000),
        },
      }),
      prisma.task.create({
        data: {
          title: "Review customer feedback reports",
          description: "Analyze last week's customer feedback and create action items.",
          status: "in_progress",
          priority: "medium",
          category: "customer_service",
          creatorId: users[0].id,
          assigneeId: users[4].id,
          locationId: locations[2].id,
        },
      }),
      prisma.task.create({
        data: {
          title: "Train new hire on POS system",
          description: "Complete POS system training for the new team member starting Monday.",
          status: "pending",
          priority: "medium",
          category: "training",
          creatorId: users[4].id,
          assigneeId: users[5].id,
          locationId: locations[2].id,
          dueDate: new Date(Date.now() + 432000000),
        },
      }),
    ]);

    // Create SOPs
    await Promise.all([
      prisma.sOP.create({
        data: {
          title: "Store Opening Procedures",
          description: "Standard procedures for opening the store each morning.",
          content:
            "## Store Opening Procedures\n\n### 1. Arrive 30 minutes before opening\n- Disarm security system\n- Turn on all lights\n- Check temperature controls\n\n### 2. Cash Register Setup\n- Count starting cash\n- Log into POS system\n- Run test transaction\n\n### 3. Store Walkthrough\n- Check all displays are neat\n- Ensure all price tags are visible\n- Restock any empty shelves\n\n### 4. Final Checks\n- Unlock front doors at opening time\n- Greet first customers\n- Report any issues to manager",
          category: "operations",
          status: "published",
          version: "2.1",
        },
      }),
      prisma.sOP.create({
        data: {
          title: "Food Safety Guidelines",
          description: "Comprehensive food safety and handling procedures for all kitchen staff.",
          content:
            "## Food Safety Guidelines\n\n### Temperature Control\n- Cold food must be stored below 40°F (4°C)\n- Hot food must be held above 140°F (60°C)\n- Check temperatures every 2 hours\n\n### Personal Hygiene\n- Wash hands for 20 seconds with soap\n- Wear clean apron and hair net\n- No jewelry while handling food\n\n### Cross-Contamination Prevention\n- Use separate cutting boards for meat and vegetables\n- Store raw meat on lowest shelf\n- Clean and sanitize all surfaces between tasks",
          category: "safety",
          status: "published",
          version: "3.0",
        },
      }),
      prisma.sOP.create({
        data: {
          title: "Customer Complaint Resolution",
          description: "Step-by-step guide for handling customer complaints effectively.",
          content:
            "## Customer Complaint Resolution\n\n### Step 1: Listen\n- Let the customer explain fully\n- Take notes if needed\n- Show empathy\n\n### Step 2: Acknowledge\n- Apologize for the inconvenience\n- Repeat the issue back to confirm understanding\n\n### Step 3: Resolve\n- Offer a solution within your authority\n- Escalate to manager if needed\n- Document the resolution\n\n### Step 4: Follow Up\n- Check back with the customer\n- Update CRM system\n- Share learnings with team",
          category: "operations",
          status: "published",
          version: "1.5",
        },
      }),
      prisma.sOP.create({
        data: {
          title: "Emergency Evacuation Plan",
          description: "Emergency evacuation procedures for all company locations.",
          content:
            "## Emergency Evacuation Plan\n\n### Fire Emergency\n1. Pull fire alarm\n2. Call 911\n3. Guide customers to nearest exit\n4. Meet at designated assembly point\n\n### Medical Emergency\n1. Call 911\n2. Administer first aid if trained\n3. Clear the area\n4. Document incident\n\n### Severe Weather\n1. Move to interior rooms\n2. Stay away from windows\n3. Monitor weather alerts\n4. Resume normal operations only after all-clear",
          category: "safety",
          status: "published",
          version: "1.0",
        },
      }),
      prisma.sOP.create({
        data: {
          title: "New Employee Onboarding",
          description: "Onboarding checklist and procedures for new team members.",
          content:
            "## New Employee Onboarding\n\n### Day 1\n- Welcome and tour\n- HR paperwork\n- System access setup\n- Meet the team\n\n### Week 1\n- Shadow experienced staff\n- Complete safety training\n- Learn POS system\n- Study product knowledge\n\n### Month 1\n- Complete all mandatory training\n- First performance check-in\n- Set 90-day goals",
          category: "hr",
          status: "draft",
          version: "1.0",
        },
      }),
    ]);

    // Create checklists with items
    const checklist1 = await prisma.checklist.create({
      data: {
        title: "Daily Store Opening Checklist",
        description: "Complete all items before store opens to customers.",
        category: "operations",
        frequency: "daily",
        locationId: locations[0].id,
        status: "active",
        items: {
          create: [
            { label: "Lights and signage turned on", type: "checkbox", required: true, sortOrder: 0 },
            { label: "POS system tested", type: "checkbox", required: true, sortOrder: 1 },
            { label: "Cash float counted", type: "number", required: true, sortOrder: 2 },
            { label: "Store temperature check (°F)", type: "number", required: true, sortOrder: 3 },
            { label: "Entrance and exits clear", type: "checkbox", required: true, sortOrder: 4 },
            { label: "Displays properly arranged", type: "checkbox", required: true, sortOrder: 5 },
            { label: "Photo of store front", type: "photo", required: false, sortOrder: 6 },
            { label: "Additional notes", type: "text", required: false, sortOrder: 7 },
          ],
        },
      },
    });

    const checklist2 = await prisma.checklist.create({
      data: {
        title: "Kitchen Hygiene Checklist",
        description: "Daily hygiene and cleanliness verification for kitchen areas.",
        category: "hygiene",
        frequency: "daily",
        locationId: locations[2].id,
        status: "active",
        items: {
          create: [
            { label: "Handwashing stations stocked", type: "checkbox", required: true, sortOrder: 0 },
            { label: "Food storage temperatures correct", type: "checkbox", required: true, sortOrder: 1 },
            { label: "Fridge temperature (°F)", type: "number", required: true, sortOrder: 2 },
            { label: "Work surfaces sanitized", type: "checkbox", required: true, sortOrder: 3 },
            { label: "Waste bins emptied", type: "checkbox", required: true, sortOrder: 4 },
            { label: "Photo of kitchen area", type: "photo", required: true, sortOrder: 5 },
          ],
        },
      },
    });

    await prisma.checklist.create({
      data: {
        title: "Weekly Safety Inspection",
        description: "Weekly safety equipment and procedures verification.",
        category: "safety",
        frequency: "weekly",
        locationId: locations[0].id,
        status: "active",
        items: {
          create: [
            { label: "Fire extinguishers inspected", type: "checkbox", required: true, sortOrder: 0 },
            { label: "Emergency exits clear", type: "checkbox", required: true, sortOrder: 1 },
            { label: "First aid kit fully stocked", type: "checkbox", required: true, sortOrder: 2 },
            { label: "Safety signage visible", type: "checkbox", required: true, sortOrder: 3 },
            { label: "Spill kits available", type: "checkbox", required: true, sortOrder: 4 },
            { label: "Notes on any issues found", type: "text", required: false, sortOrder: 5 },
          ],
        },
      },
    });

    // Create checklist responses
    await Promise.all([
      prisma.checklistResponse.create({
        data: {
          checklistId: checklist1.id,
          userId: users[2].id,
          data: JSON.stringify({ items: [true, true, 200, 72, true, true, null, "All good"] }),
          score: 95,
        },
      }),
      prisma.checklistResponse.create({
        data: {
          checklistId: checklist2.id,
          userId: users[5].id,
          data: JSON.stringify({ items: [true, true, 38, true, true, null] }),
          score: 100,
        },
      }),
    ]);

    // Create audits with questions
    const audit1 = await prisma.audit.create({
      data: {
        title: "Store Cleanliness Audit",
        description: "Monthly cleanliness and organization audit for retail stores.",
        category: "cleanliness",
        locationId: locations[0].id,
        status: "active",
        questions: {
          create: [
            { question: "Is the entrance area clean and welcoming?", type: "yes_no", weight: 1.0, sortOrder: 0 },
            { question: "Rate the overall floor cleanliness (1-5)", type: "rating", weight: 1.5, sortOrder: 1 },
            { question: "Are shelves dust-free and organized?", type: "yes_no", weight: 1.0, sortOrder: 2 },
            { question: "Rate restroom cleanliness (1-5)", type: "rating", weight: 2.0, sortOrder: 3 },
            { question: "Photo of any issues found", type: "photo", weight: 0.5, sortOrder: 4 },
            { question: "Additional observations", type: "text", weight: 0.5, sortOrder: 5 },
          ],
        },
      },
    });

    const audit2 = await prisma.audit.create({
      data: {
        title: "Food Safety Compliance Audit",
        description: "Quarterly food safety compliance check for kitchen operations.",
        category: "food_safety",
        locationId: locations[2].id,
        status: "active",
        questions: {
          create: [
            { question: "Are all food handlers wearing proper PPE?", type: "yes_no", weight: 2.0, sortOrder: 0 },
            { question: "Rate food storage organization (1-5)", type: "rating", weight: 1.5, sortOrder: 1 },
            { question: "Are temperature logs up to date?", type: "yes_no", weight: 2.0, sortOrder: 2 },
            { question: "Is cross-contamination prevention followed?", type: "yes_no", weight: 2.0, sortOrder: 3 },
            { question: "Rate overall kitchen cleanliness (1-5)", type: "rating", weight: 1.5, sortOrder: 4 },
            { question: "Photo evidence of compliance", type: "photo", weight: 0.5, sortOrder: 5 },
          ],
        },
      },
    });

    await prisma.audit.create({
      data: {
        title: "Visual Merchandising Audit",
        description: "Check compliance with visual merchandising guidelines.",
        category: "visual_merchandising",
        locationId: locations[1].id,
        status: "active",
        questions: {
          create: [
            { question: "Are window displays current and seasonal?", type: "yes_no", weight: 1.5, sortOrder: 0 },
            { question: "Rate mannequin styling accuracy (1-5)", type: "rating", weight: 1.0, sortOrder: 1 },
            { question: "Are promotional signs correctly placed?", type: "yes_no", weight: 1.0, sortOrder: 2 },
            { question: "Rate product facing and alignment (1-5)", type: "rating", weight: 1.5, sortOrder: 3 },
            { question: "Photo of main display area", type: "photo", weight: 0.5, sortOrder: 4 },
          ],
        },
      },
    });

    // Create audit responses
    await Promise.all([
      prisma.auditResponse.create({
        data: {
          auditId: audit1.id,
          userId: users[1].id,
          data: JSON.stringify({ answers: ["yes", 4, "yes", 3, null, "Minor dust on top shelves"] }),
          score: 82,
        },
      }),
      prisma.auditResponse.create({
        data: {
          auditId: audit2.id,
          userId: users[4].id,
          data: JSON.stringify({ answers: ["yes", 5, "yes", "yes", 4, null] }),
          score: 94,
        },
      }),
      prisma.auditResponse.create({
        data: {
          auditId: audit1.id,
          userId: users[1].id,
          data: JSON.stringify({ answers: ["yes", 5, "yes", 4, null, "Great improvement this month"] }),
          score: 91,
          completedAt: new Date(Date.now() - 2592000000),
        },
      }),
    ]);

    // Create training courses
    await Promise.all([
      prisma.training.create({
        data: {
          title: "New Employee Orientation",
          description: "Comprehensive orientation for all new team members covering company values, policies, and procedures.",
          content: "Welcome to the team! This training covers everything you need to know to get started.",
          category: "onboarding",
          duration: 120,
          status: "published",
          modules: {
            create: [
              { title: "Company Overview & Values", content: "Learn about our mission, vision, and core values.", type: "lesson", sortOrder: 0 },
              { title: "Workplace Policies", content: "Review our key workplace policies including attendance, dress code, and conduct.", type: "lesson", sortOrder: 1 },
              { title: "Safety Orientation", content: "Essential safety training including emergency procedures and first aid locations.", type: "video", sortOrder: 2 },
              { title: "Orientation Quiz", content: "Test your knowledge from the orientation materials.", type: "quiz", sortOrder: 3 },
            ],
          },
        },
      }),
      prisma.training.create({
        data: {
          title: "Food Handler Certification",
          description: "Required food safety certification training for all kitchen staff.",
          content: "This training prepares you for the food handler certification exam.",
          category: "safety",
          duration: 90,
          status: "published",
          modules: {
            create: [
              { title: "Food Safety Basics", content: "Fundamentals of safe food handling and preparation.", type: "lesson", sortOrder: 0 },
              { title: "Temperature Control", content: "Understanding proper temperature ranges for food storage and cooking.", type: "lesson", sortOrder: 1 },
              { title: "Cross-Contamination Prevention", content: "How to prevent cross-contamination in the kitchen.", type: "video", sortOrder: 2 },
              { title: "Certification Exam", content: "Complete this exam to earn your food handler certification.", type: "quiz", sortOrder: 3 },
            ],
          },
        },
      }),
      prisma.training.create({
        data: {
          title: "Customer Service Excellence",
          description: "Advanced customer service skills training for frontline staff.",
          content: "Master the art of exceptional customer service.",
          category: "operations",
          duration: 60,
          status: "published",
          modules: {
            create: [
              { title: "Greeting & First Impressions", content: "How to make a great first impression with every customer.", type: "lesson", sortOrder: 0 },
              { title: "Handling Difficult Situations", content: "Techniques for de-escalation and complaint resolution.", type: "lesson", sortOrder: 1 },
              { title: "Service Excellence Quiz", content: "Test your customer service knowledge.", type: "quiz", sortOrder: 2 },
            ],
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      counts: {
        locations: locations.length,
        users: users.length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}
