export const DEMO_STUDENT_STATS = {
  applications_submitted: 12,
  interviews_scheduled: 3,
  offers_received: 1,
  placement_status: "Strong fit",
};

export const DEMO_STUDENT_APPLICATIONS = [
  {
    id: "app-101",
    internship_company: "Google",
    internship_title: "Software Engineering Intern",
    status: "interview_scheduled",
    applied_at: "2026-09-10T09:30:00.000Z",
  },
  {
    id: "app-102",
    internship_company: "Microsoft",
    internship_title: "Product Management Intern",
    status: "shortlisted",
    applied_at: "2026-09-07T11:00:00.000Z",
  },
  {
    id: "app-103",
    internship_company: "Amazon",
    internship_title: "Data Analyst Intern",
    status: "submitted",
    applied_at: "2026-09-04T13:45:00.000Z",
  },
  {
    id: "app-104",
    internship_company: "Infosys",
    internship_title: "Frontend Developer Intern",
    status: "accepted",
    applied_at: "2026-08-28T10:15:00.000Z",
  },
];

export const DEMO_EMPLOYER_STATS = {
  active_listings: 6,
  total_applications: 142,
  shortlisted: 18,
  hired: 4,
};

export const DEMO_EMPLOYER_APPLICATIONS = [
  {
    id: "emp-app-1",
    student_name: "Aisha Khan",
    internship_title: "Frontend Developer Intern",
    status: "under_review",
    applied_at: "2026-09-11T08:00:00.000Z",
  },
  {
    id: "emp-app-2",
    student_name: "Rahul Mehta",
    internship_title: "Product Analyst Intern",
    status: "shortlisted",
    applied_at: "2026-09-09T12:30:00.000Z",
  },
  {
    id: "emp-app-3",
    student_name: "Priya Sen",
    internship_title: "Data Science Intern",
    status: "interview_scheduled",
    applied_at: "2026-09-08T09:45:00.000Z",
  },
  {
    id: "emp-app-4",
    student_name: "Dev Patel",
    internship_title: "Android Developer Intern",
    status: "accepted",
    applied_at: "2026-09-05T10:20:00.000Z",
  },
];

export const DEMO_LISTINGS = [
  {
    id: "listing-1",
    title: "Frontend Developer Intern",
    location: "Bengaluru",
    deadline: "2026-09-25",
    is_active: true,
  },
  {
    id: "listing-2",
    title: "Data Analyst Intern",
    location: "Hyderabad",
    deadline: "2026-09-30",
    is_active: true,
  },
  {
    id: "listing-3",
    title: "Product Management Intern",
    location: "Remote",
    deadline: "2026-10-05",
    is_active: false,
  },
  {
    id: "listing-4",
    title: "Cloud Engineering Intern",
    location: "Pune",
    deadline: "2026-10-12",
    is_active: true,
  },
];

export const DEMO_ADMIN_DATA = {
  stats: {
    total_students: 482,
    total_employers: 89,
    active_listings: 146,
    pending_approvals: 7,
  },
  recent_users: [
    { id: "u-1", full_name: "Aisha Khan", username: "aisha", role: "student" },
    { id: "u-2", full_name: "Nikhil Rao", username: "nikhil", role: "student" },
    { id: "u-3", full_name: "Sonia Mehra", username: "sonia", role: "employer" },
    { id: "u-4", full_name: "Rohan Das", username: "rohan", role: "student" },
  ],
  pending_employers: [
    { id: "e-1", full_name: "Sonia Mehra", username: "sonia" },
    { id: "e-2", full_name: "Varun Iyer", username: "varun" },
    { id: "e-3", full_name: "Meera Joshi", username: "meera" },
  ],
};
