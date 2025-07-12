import { Icon } from "@iconify/react";

export default function UserRegistrationStats({ users = [], adminUser }) {
  // Calculate new registrations since last login
  const adminLastLogin = adminUser?.last_login_at ? new Date(adminUser.last_login_at) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago
  
  const newRegistrations = users.filter(user => {
    const userCreatedAt = new Date(user.created_at);
    return userCreatedAt > adminLastLogin;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 mb-10">
        <div className="px-4 py-2 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
          <p className="">There has been {newRegistrations} new user registrations since your last login</p>
        </div> 
    </div>
  );
} 