import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Store from "@/models/Store";

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const existingCount = await Store.countDocuments();
    if (existingCount > 0) {
      const stores = await Store.find().lean();
      return NextResponse.json({
        message: `Already seeded with ${existingCount} stores.`,
        stores: stores.map((s: any) => ({ ...s, id: s._id.toString() })),
      });
    }

    const initialStores = [
      {
        name: "DTU Main Hub",
        slug: "dtu-hub",
        code: "DTU01",
        address: "Shahbad Daulatpur, Main Bawana Road, Rohini, Delhi",
        city: "Delhi",
        state: "Delhi",
        country: "India",
        postalCode: "110042",
        location: {
          type: "Point",
          coordinates: [77.1170, 28.7499], // [lng, lat]
        },
        serviceRadiusKm: 5,
        serviceAreas: [
          "DTU Sector 16",
          "DTU Sector 17",
          "DTU Campus Hostels",
          "DTU Main Gate",
          "Shahbad Daulatpur",
          "Rohini Sector 16",
          "Rohini Sector 17",
          "Civil Engineering Department",
          "Computer Science Department",
          "Mechanical Engineering Department",
          "Electrical Engineering Department",
          "Boys Hostel Block A",
          "Boys Hostel Block B",
          "Girls Hostel",
        ],
        isActive: true,
        isAcceptingOrders: true,
        openingTime: "07:00",
        closingTime: "23:59",
        minOrderValue: 0,
        deliveryFee: 20,
        estimatedDeliveryMins: 15,
        phone: "9999000001",
        pin: "1234",
        managerName: "DTU Store Operations",
        notes: "Primary dark store serving DTU & Rohini",
      },
      {
        name: "NSUT Express Hub",
        slug: "nsut-hub",
        code: "NSUT01",
        address: "Netaji Subhas University of Technology, Sector 3, Dwarka, New Delhi",
        city: "Delhi",
        state: "Delhi",
        country: "India",
        postalCode: "110078",
        location: {
          type: "Point",
          coordinates: [77.0375, 28.6091], // [lng, lat]
        },
        serviceRadiusKm: 5,
        serviceAreas: [
          "NSUT Main Campus",
          "NSUT Hostels",
          "Dwarka Sector 3",
          "Dwarka Sector 13",
          "Dwarka Sector 14",
          "NSUT Admin Block",
          "NSUT Canteen",
        ],
        isActive: true,
        isAcceptingOrders: true,
        openingTime: "07:00",
        closingTime: "23:59",
        minOrderValue: 0,
        deliveryFee: 20,
        estimatedDeliveryMins: 18,
        phone: "9999000002",
        pin: "1234",
        managerName: "NSUT Store Operations",
        notes: "Express dark store serving NSUT Dwarka",
      },
      {
        name: "DU North Campus Express",
        slug: "du-north-hub",
        code: "DUNORTH01",
        address: "Hudson Lane, GTB Nagar, North Campus, Delhi",
        city: "Delhi",
        state: "Delhi",
        country: "India",
        postalCode: "110009",
        location: {
          type: "Point",
          coordinates: [77.2078, 28.6892], // [lng, lat]
        },
        serviceRadiusKm: 5,
        serviceAreas: [
          "DU North Campus",
          "Kamla Nagar",
          "Hudson Lane",
          "GTB Nagar",
          "Vijay Nagar",
          "SRCC Gate",
          "Hindu College",
          "Hansraj College",
        ],
        isActive: true,
        isAcceptingOrders: true,
        openingTime: "07:00",
        closingTime: "23:59",
        minOrderValue: 0,
        deliveryFee: 25,
        estimatedDeliveryMins: 20,
        phone: "9999000003",
        pin: "1234",
        managerName: "North Campus Operations",
        notes: "Hub serving DU colleges & Hudson Lane",
      },
    ];

    const created = await Store.insertMany(initialStores);
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${created.length} initial stores.`,
      stores: created.map((s: any) => ({ ...s.toObject(), id: s._id.toString() })),
    });
  } catch (error: any) {
    console.error("POST /api/stores/seed error:", error);
    return NextResponse.json({ error: "Failed to seed stores", details: error.message }, { status: 500 });
  }
}
