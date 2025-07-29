import { db } from "./db";
import { clients, teamMembers, clientAssignments, activities, sampleRequests, transactions } from "@shared/schema";

const sampleTeamMembers = [
  {
    name: "Sarah Johnson",
    email: "sarah@jewelryai.com",
    role: "Project Manager",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b167?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face"
  },
  {
    name: "Michael Chen",
    email: "michael@jewelryai.com", 
    role: "AI Engineer",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face"
  },
  {
    name: "Emily Rodriguez",
    email: "emily@jewelryai.com",
    role: "UI/UX Designer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face"
  },
  {
    name: "David Kim",
    email: "david@jewelryai.com",
    role: "Technical Lead",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face"
  },
  {
    name: "Lisa Thompson",
    email: "lisa@jewelryai.com",
    role: "Quality Assurance",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face"
  }
];

const sampleClients = [
  {
    name: "Golden Crown Jewelers",
    contactPerson: "James Windsor",
    email: "james@goldencrown.com",
    phone: "+1-555-0123",
    country: "United States",
    countryCode: "US",
    contractStartDate: new Date("2024-01-15"),
    expectedCompletionDate: new Date("2024-12-15"),
    projectStatus: "In Progress",
    progressPercentage: 75,
    totalProjectFee: "125000.00",
    amountPaid: "93750.00",
    projectType: "Premium Package",
    priorityLevel: "High",
    notes: "High-end jewelry retailer focusing on custom engagement rings. Requires advanced AI try-on capabilities."
  },
  {
    name: "Sapphire Boutique",
    contactPerson: "Maria Santos",
    email: "maria@sapphireboutique.com",
    phone: "+44-20-7946-0958",
    country: "United Kingdom",
    countryCode: "GB",
    contractStartDate: new Date("2024-02-01"),
    expectedCompletionDate: new Date("2024-10-30"),
    projectStatus: "Testing",
    progressPercentage: 90,
    totalProjectFee: "85000.00",
    amountPaid: "85000.00",
    projectType: "Custom AI Model",
    priorityLevel: "Medium",
    notes: "Boutique jewelry store specializing in sapphire collections. Integration with existing e-commerce platform."
  },
  {
    name: "Diamond Dynasty",
    contactPerson: "Robert Chen",
    email: "robert@diamonddynasty.ca",
    phone: "+1-604-555-0199",
    country: "Canada",
    countryCode: "CA",
    contractStartDate: new Date("2024-03-10"),
    expectedCompletionDate: new Date("2025-01-10"),
    projectStatus: "Planning",
    progressPercentage: 25,
    totalProjectFee: "150000.00",
    amountPaid: "37500.00",
    projectType: "Enterprise Solution",
    priorityLevel: "High",
    notes: "Large jewelry chain with multiple locations. Requires multi-store deployment and analytics dashboard."
  },
  {
    name: "Luxe Gems Ltd",
    contactPerson: "Priya Sharma",
    email: "priya@luxegems.in",
    phone: "+91-22-2654-8900",
    country: "India",
    countryCode: "IN",
    contractStartDate: new Date("2023-11-20"),
    expectedCompletionDate: new Date("2024-08-20"),
    projectStatus: "Completed",
    progressPercentage: 100,
    totalProjectFee: "75000.00",
    amountPaid: "75000.00",
    projectType: "Basic Try-On",
    priorityLevel: "Medium",
    notes: "Successfully launched AI try-on for traditional Indian jewelry. Excellent customer feedback."
  },
  {
    name: "Royal Diamonds",
    contactPerson: "Ahmed Al-Rashid",
    email: "ahmed@royaldiamonds.ae",
    phone: "+971-4-555-0177",
    country: "UAE",
    countryCode: "AE",
    contractStartDate: new Date("2024-01-05"),
    expectedCompletionDate: new Date("2024-09-05"),
    projectStatus: "Review",
    progressPercentage: 95,
    totalProjectFee: "110000.00",
    amountPaid: "82500.00",
    projectType: "Premium Package",
    priorityLevel: "High",
    notes: "Luxury jewelry store in Dubai. Final review phase before production deployment."
  },
  {
    name: "Parisian Pearls",
    contactPerson: "Claire Dubois",
    email: "claire@parisianpearls.fr",
    phone: "+33-1-42-96-12-34",
    country: "France", 
    countryCode: "FR",
    contractStartDate: new Date("2024-04-01"),
    expectedCompletionDate: new Date("2024-11-01"),
    projectStatus: "In Progress",
    progressPercentage: 60,
    totalProjectFee: "95000.00",
    amountPaid: "47500.00",
    projectType: "Custom AI Model",
    priorityLevel: "Medium",
    notes: "Elegant pearl jewelry specialist. Focus on showcasing pearl luster and color variations."
  },
  {
    name: "Sydney Sparkles",
    contactPerson: "Emma Wilson",
    email: "emma@sydneysparkles.com.au",
    phone: "+61-2-9876-5432",
    country: "Australia",
    countryCode: "AU",
    contractStartDate: new Date("2024-02-15"),
    expectedCompletionDate: new Date("2024-12-15"),
    projectStatus: "In Progress",
    progressPercentage: 45,
    totalProjectFee: "70000.00",
    amountPaid: "35000.00",
    projectType: "Basic Try-On",
    priorityLevel: "Low",
    notes: "Australian jewelry retailer focusing on everyday wear pieces. Mobile-first approach required."
  },
  {
    name: "Tokyo Treasures",
    contactPerson: "Hiroshi Tanaka",
    email: "hiroshi@tokyotreasures.jp",
    phone: "+81-3-1234-5678",
    country: "Japan",
    countryCode: "JP",
    contractStartDate: new Date("2024-03-20"),
    expectedCompletionDate: new Date("2025-02-20"),
    projectStatus: "Planning",
    progressPercentage: 15,
    totalProjectFee: "180000.00",
    amountPaid: "45000.00",
    projectType: "Enterprise Solution",
    priorityLevel: "High",
    notes: "Premium Japanese jewelry brand. Requires integration with local payment systems and cultural customization."
  },
  {
    name: "Berlin Brilliance",
    contactPerson: "Hans Mueller",
    email: "hans@berlinbrilliance.de",
    phone: "+49-30-1234-5678",
    country: "Germany",
    countryCode: "DE",
    contractStartDate: new Date("2023-12-01"),
    expectedCompletionDate: new Date("2024-07-01"),
    projectStatus: "On Hold",
    progressPercentage: 30,
    totalProjectFee: "65000.00",
    amountPaid: "19500.00",
    projectType: "Basic Try-On",
    priorityLevel: "Low",
    notes: "Project temporarily paused due to budget constraints. Client considering upgrade to Premium Package."
  }
];

const sampleActivities = [
  {
    clientId: 1, // Golden Crown Jewelers
    type: "completed",
    description: "AI model training completed - 95% accuracy achieved"
  },
  {
    clientId: 2, // Sapphire Boutique
    type: "payment",
    description: "Final payment received - $85,000"
  },
  {
    clientId: 3, // Diamond Dynasty
    type: "meeting",
    description: "Kick-off meeting scheduled for next week"
  },
  {
    clientId: 4, // Luxe Gems Ltd
    type: "completed",
    description: "Project delivered successfully - Client feedback: Excellent"
  },
  {
    clientId: 5, // Royal Diamonds
    type: "urgent",
    description: "Final review deadline approaching - 3 days remaining"
  },
  {
    clientId: 6, // Parisian Pearls
    type: "proposal",
    description: "Additional features proposal sent for approval"
  },
  {
    clientId: 1, // Golden Crown Jewelers
    type: "meeting",
    description: "Weekly progress review completed"
  },
  {
    clientId: 7, // Sydney Sparkles
    type: "payment",
    description: "Milestone payment received - $35,000"
  }
];

const sampleSampleRequests = [
  {
    companyName: "Elite Diamonds NYC",
    country: "US",
    requestDate: "2024-07-10",
    status: "pending",
    notes: "Luxury diamond retailer interested in AI try-on for engagement rings"
  },
  {
    companyName: "Milano Jewels",
    country: "IT",
    requestDate: "2024-07-08",
    status: "completed",
    notes: "Italian boutique specializing in handcrafted gold jewelry"
  },
  {
    companyName: "Swiss Timepieces",
    country: "CH",
    requestDate: "2024-07-05",
    status: "pending",
    notes: "High-end watch manufacturer looking for virtual try-on technology"
  },
  {
    companyName: "Mumbai Gems",
    country: "IN",
    requestDate: "2024-07-03",
    status: "completed",
    notes: "Traditional Indian jewelry store focusing on wedding collections"
  },
  {
    companyName: "Berlin Luxury",
    country: "DE",
    requestDate: "2024-06-28",
    status: "cancelled",
    notes: "Project cancelled due to budget constraints"
  },
  {
    companyName: "Singapore Pearls",
    country: "SG",
    requestDate: "2024-06-25",
    status: "pending",
    notes: "Premium pearl jewelry specialist in Southeast Asia"
  }
];

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data (order matters due to foreign key constraints)
    await db.delete(activities);
    await db.delete(clientAssignments);
    await db.delete(sampleRequests);
    await db.delete(transactions);
    await db.delete(clients);
    await db.delete(teamMembers);
    
    // Insert team members
    console.log("👥 Inserting team members...");
    const insertedTeamMembers = await db.insert(teamMembers).values(sampleTeamMembers).returning();
    
    // Insert clients
    console.log("🏢 Inserting clients...");
    const insertedClients = await db.insert(clients).values(sampleClients).returning();
    
    // Create client assignments (randomly assign team members)
    console.log("🔗 Creating client assignments...");
    const assignments = insertedClients.map((client, index) => ({
      clientId: client.id,
      teamMemberId: insertedTeamMembers[index % insertedTeamMembers.length].id
    }));
    await db.insert(clientAssignments).values(assignments);
    
    // Insert activities
    console.log("📝 Inserting activities...");
    const activitiesWithClientIds = sampleActivities.map(activity => ({
      ...activity,
      clientId: insertedClients[activity.clientId - 1]?.id || insertedClients[0].id
    }));
    await db.insert(activities).values(activitiesWithClientIds);
    
    // Insert sample requests
    console.log("💎 Inserting sample requests...");
    await db.insert(sampleRequests).values(sampleSampleRequests);
    
    console.log("✅ Database seeding completed successfully!");
    console.log(`- ${insertedTeamMembers.length} team members added`);
    console.log(`- ${insertedClients.length} clients added`);
    console.log(`- ${assignments.length} assignments created`);
    console.log(`- ${activitiesWithClientIds.length} activities added`);
    console.log(`- ${sampleSampleRequests.length} sample requests added`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}