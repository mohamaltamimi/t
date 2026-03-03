import bcrypt from "bcryptjs";
import { prisma } from "./db";

let seeding = false;

export async function seedDatabase() {
  if (seeding) return;
  seeding = true;

  try {
    const existing = await prisma.user.count();
    if (existing > 0) return;

    const locations = await Promise.all([
      prisma.location.create({ data: { name: "Downtown Flagship Store", address: "123 Main Street", city: "New York", region: "Northeast", type: "store", status: "active" } }),
      prisma.location.create({ data: { name: "Mall of America Branch", address: "456 Shopping Ave", city: "Minneapolis", region: "Midwest", type: "store", status: "active" } }),
      prisma.location.create({ data: { name: "Central Kitchen", address: "789 Industrial Blvd", city: "Chicago", region: "Midwest", type: "restaurant", status: "active" } }),
      prisma.location.create({ data: { name: "West Coast Office", address: "321 Tech Lane", city: "San Francisco", region: "West", type: "office", status: "active" } }),
      prisma.location.create({ data: { name: "Distribution Center", address: "555 Logistics Way", city: "Dallas", region: "South", type: "warehouse", status: "active" } }),
    ]);

    const hp = async (p: string) => bcrypt.hash(p, 10);
    const users = await Promise.all([
      prisma.user.create({ data: { name: "Sarah Admin", email: "admin@wooqer.com", password: await hp("admin123"), role: "admin" } }),
      prisma.user.create({ data: { name: "Mike Manager", email: "manager@wooqer.com", password: await hp("manager123"), role: "manager", locationId: locations[0].id } }),
      prisma.user.create({ data: { name: "John Staff", email: "staff@wooqer.com", password: await hp("staff123"), role: "frontline", locationId: locations[0].id } }),
      prisma.user.create({ data: { name: "Emily Chen", email: "emily@wooqer.com", password: await hp("staff123"), role: "frontline", locationId: locations[1].id } }),
      prisma.user.create({ data: { name: "David Wilson", email: "david@wooqer.com", password: await hp("manager123"), role: "manager", locationId: locations[2].id } }),
      prisma.user.create({ data: { name: "Lisa Martinez", email: "lisa@wooqer.com", password: await hp("staff123"), role: "frontline", locationId: locations[2].id } }),
    ]);

    await Promise.all([
      prisma.task.create({ data: { title: "Complete morning store opening checklist", description: "Ensure all opening procedures are followed.", status: "completed", priority: "high", category: "operations", creatorId: users[1].id, assigneeId: users[2].id, locationId: locations[0].id, dueDate: new Date(Date.now() - 86400000) } }),
      prisma.task.create({ data: { title: "Restock dairy section", description: "Restock all dairy products from the morning delivery.", status: "in_progress", priority: "medium", category: "inventory", creatorId: users[1].id, assigneeId: users[3].id, locationId: locations[1].id, dueDate: new Date(Date.now() + 86400000) } }),
      prisma.task.create({ data: { title: "Deep clean kitchen equipment", description: "Monthly deep cleaning of all kitchen equipment.", status: "pending", priority: "urgent", category: "hygiene", creatorId: users[4].id, assigneeId: users[5].id, locationId: locations[2].id, dueDate: new Date(Date.now() + 172800000) } }),
      prisma.task.create({ data: { title: "Update visual merchandising display", description: "Set up new seasonal displays.", status: "pending", priority: "medium", category: "merchandising", creatorId: users[0].id, assigneeId: users[2].id, locationId: locations[0].id, dueDate: new Date(Date.now() + 259200000) } }),
      prisma.task.create({ data: { title: "Conduct staff safety briefing", description: "Weekly safety briefing.", status: "overdue", priority: "high", category: "safety", creatorId: users[0].id, assigneeId: users[1].id, locationId: locations[0].id, dueDate: new Date(Date.now() - 172800000) } }),
      prisma.task.create({ data: { title: "Inventory count - electronics section", description: "Complete full inventory count.", status: "pending", priority: "high", category: "inventory", creatorId: users[1].id, assigneeId: users[3].id, locationId: locations[1].id, dueDate: new Date(Date.now() + 86400000) } }),
      prisma.task.create({ data: { title: "Review customer feedback reports", description: "Analyze last week's customer feedback.", status: "in_progress", priority: "medium", category: "customer_service", creatorId: users[0].id, assigneeId: users[4].id, locationId: locations[2].id } }),
      prisma.task.create({ data: { title: "Train new hire on POS system", description: "Complete POS system training.", status: "pending", priority: "medium", category: "training", creatorId: users[4].id, assigneeId: users[5].id, locationId: locations[2].id, dueDate: new Date(Date.now() + 432000000) } }),
    ]);

    await Promise.all([
      prisma.sOP.create({ data: { title: "Store Opening Procedures", description: "Standard procedures for opening the store.", content: "## Store Opening\n\n1. Arrive 30 min before opening\n2. Disarm security\n3. Turn on lights\n4. Count cash\n5. Check displays\n6. Unlock doors", category: "operations", status: "published", version: "2.1" } }),
      prisma.sOP.create({ data: { title: "Food Safety Guidelines", description: "Food safety and handling procedures.", content: "## Food Safety\n\n1. Temperature control\n2. Personal hygiene\n3. Cross-contamination prevention", category: "safety", status: "published", version: "3.0" } }),
      prisma.sOP.create({ data: { title: "Customer Complaint Resolution", description: "Handling customer complaints.", content: "## Complaints\n\n1. Listen\n2. Acknowledge\n3. Resolve\n4. Follow up", category: "operations", status: "published", version: "1.5" } }),
      prisma.sOP.create({ data: { title: "Emergency Evacuation Plan", description: "Emergency evacuation procedures.", content: "## Emergency\n\n1. Pull alarm\n2. Call 911\n3. Guide to exits\n4. Meet at assembly point", category: "safety", status: "published", version: "1.0" } }),
    ]);

    const cl1 = await prisma.checklist.create({ data: { title: "Daily Store Opening Checklist", description: "Complete before store opens.", category: "operations", frequency: "daily", locationId: locations[0].id, status: "active", items: { create: [
      { label: "Lights and signage on", type: "checkbox", required: true, sortOrder: 0 },
      { label: "POS system tested", type: "checkbox", required: true, sortOrder: 1 },
      { label: "Cash float counted", type: "number", required: true, sortOrder: 2 },
      { label: "Temperature check", type: "number", required: true, sortOrder: 3 },
      { label: "Exits clear", type: "checkbox", required: true, sortOrder: 4 },
    ] } } });

    const cl2 = await prisma.checklist.create({ data: { title: "Kitchen Hygiene Checklist", description: "Daily hygiene verification.", category: "hygiene", frequency: "daily", locationId: locations[2].id, status: "active", items: { create: [
      { label: "Handwashing stations stocked", type: "checkbox", required: true, sortOrder: 0 },
      { label: "Food storage temps correct", type: "checkbox", required: true, sortOrder: 1 },
      { label: "Work surfaces sanitized", type: "checkbox", required: true, sortOrder: 2 },
    ] } } });

    await prisma.checklistResponse.create({ data: { checklistId: cl1.id, userId: users[2].id, data: JSON.stringify({ items: [true, true, 200, 72, true] }), score: 95 } });
    await prisma.checklistResponse.create({ data: { checklistId: cl2.id, userId: users[5].id, data: JSON.stringify({ items: [true, true, true] }), score: 100 } });

    const a1 = await prisma.audit.create({ data: { title: "Store Cleanliness Audit", description: "Monthly cleanliness audit.", category: "cleanliness", locationId: locations[0].id, status: "active", questions: { create: [
      { question: "Is the entrance clean?", type: "yes_no", weight: 1.0, sortOrder: 0 },
      { question: "Floor cleanliness (1-5)", type: "rating", weight: 1.5, sortOrder: 1 },
      { question: "Shelves organized?", type: "yes_no", weight: 1.0, sortOrder: 2 },
    ] } } });

    const a2 = await prisma.audit.create({ data: { title: "Food Safety Compliance", description: "Quarterly food safety check.", category: "food_safety", locationId: locations[2].id, status: "active", questions: { create: [
      { question: "PPE worn?", type: "yes_no", weight: 2.0, sortOrder: 0 },
      { question: "Storage organization (1-5)", type: "rating", weight: 1.5, sortOrder: 1 },
      { question: "Temp logs up to date?", type: "yes_no", weight: 2.0, sortOrder: 2 },
    ] } } });

    await prisma.auditResponse.create({ data: { auditId: a1.id, userId: users[1].id, data: JSON.stringify({ answers: ["yes", 4, "yes"] }), score: 82 } });
    await prisma.auditResponse.create({ data: { auditId: a2.id, userId: users[4].id, data: JSON.stringify({ answers: ["yes", 5, "yes"] }), score: 94 } });

    await prisma.training.create({ data: { title: "New Employee Orientation", description: "Orientation for new team members.", content: "Welcome to the team!", category: "onboarding", duration: 120, status: "published", modules: { create: [
      { title: "Company Overview", content: "Our mission and values.", type: "lesson", sortOrder: 0 },
      { title: "Workplace Policies", content: "Key policies.", type: "lesson", sortOrder: 1 },
      { title: "Orientation Quiz", content: "Test your knowledge.", type: "quiz", sortOrder: 2 },
    ] } } });

    await prisma.training.create({ data: { title: "Food Handler Certification", description: "Food safety certification.", content: "Food handler prep.", category: "safety", duration: 90, status: "published", modules: { create: [
      { title: "Food Safety Basics", content: "Safe food handling.", type: "lesson", sortOrder: 0 },
      { title: "Temperature Control", content: "Proper temperatures.", type: "lesson", sortOrder: 1 },
      { title: "Certification Exam", content: "Earn your cert.", type: "quiz", sortOrder: 2 },
    ] } } });

    await prisma.training.create({ data: { title: "Customer Service Excellence", description: "Customer service skills.", content: "Master customer service.", category: "operations", duration: 60, status: "published", modules: { create: [
      { title: "First Impressions", content: "Great first impressions.", type: "lesson", sortOrder: 0 },
      { title: "Difficult Situations", content: "De-escalation techniques.", type: "lesson", sortOrder: 1 },
      { title: "Service Quiz", content: "Test your skills.", type: "quiz", sortOrder: 2 },
    ] } } });

    console.log("Database seeded successfully");
  } catch (e) {
    console.error("Seed error:", e);
  } finally {
    seeding = false;
  }
}
